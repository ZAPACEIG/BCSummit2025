from promptflow import tool
import requests
import json
import logging
import time
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MCPTool(Enum):
    """Herramientas MCP disponibles en el servidor de Business Central."""
    GET_CUSTOMERS = "get-customers"
    GET_ITEMS = "get-items"
    GET_SALES_ORDERS = "get-sales-orders"
    GET_SALES_ORDER_LINES = "get-sales-order-lines"
    CREATE_SALES_ORDER = "create-sales-order"
    CREATE_SALES_ORDER_LINE = "create-sales-order-line"
    SHIP_AND_INVOICE_ORDER = "shipandinvoice-order"

@dataclass
class MCPToolConfig:
    """Configuración para cada herramienta MCP."""
    name: str
    required_params: List[str]
    optional_params: List[str]
    description: str

class MCPClient:
    """Cliente MCP para interactuar con el servidor de Business Central."""

    # Configuración del servidor MCP
    MCP_SERVER_URL = "https://ca-bcsummit-mcp-eus2-001.orangemushroom-bc52a549.eastus2.azurecontainerapps.io/mcp"

    # Configuración de herramientas
    TOOL_CONFIGS = {
        MCPTool.GET_CUSTOMERS: MCPToolConfig(
            name="get-customers",
            required_params=[],
            optional_params=["customer_id", "name_filter", "limit"],
            description="Obtener lista de clientes o cliente específico"
        ),
        MCPTool.GET_ITEMS: MCPToolConfig(
            name="get-items",
            required_params=[],
            optional_params=["item_id", "name_filter", "category", "limit"],
            description="Obtener lista de productos o producto específico"
        ),
        MCPTool.GET_SALES_ORDERS: MCPToolConfig(
            name="get-sales-orders",
            required_params=[],
            optional_params=["order_id", "customer_id", "status", "date_from", "date_to", "limit"],
            description="Obtener lista de órdenes de venta o orden específica"
        ),
        MCPTool.GET_SALES_ORDER_LINES: MCPToolConfig(
            name="get-sales-order-lines",
            required_params=["order_id"],
            optional_params=["line_id", "item_id", "limit"],
            description="Obtener líneas de una orden de venta específica"
        ),
        MCPTool.CREATE_SALES_ORDER: MCPToolConfig(
            name="create-sales-order",
            required_params=["customerNumber"],
            optional_params=[],
            description="Crear orden de venta completa con línea (workflow de 2 pasos)"
        ),
        MCPTool.CREATE_SALES_ORDER_LINE: MCPToolConfig(
            name="create-sales-order-line",
            required_params=["orderId", "lineObjectNumber", "quantity"],
            optional_params=[],
            description="Crear línea en orden de venta existente"
        ),
        MCPTool.SHIP_AND_INVOICE_ORDER: MCPToolConfig(
            name="shipandinvoice-order",
            required_params=["order_id"],
            optional_params=["ship_date", "invoice_date", "partial_shipment"],
            description="Enviar e facturar una orden de venta"
        )
    }

    def __init__(self):
        self._session_id: Optional[str] = None
        self._session_initialized = False

    def _initialize_session(self) -> bool:
        """Inicializa la sesión MCP con el servidor."""
        if self._session_initialized and self._session_id:
            logger.info(f"Reutilizando sesión MCP existente: {self._session_id}")
            return True

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "User-Agent": "Azure-PromptFlow-BCSummit-Client/1.0"
        }

        payload = {
            "jsonrpc": "2.0",
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"roots": {"listChanged": True}, "sampling": {}},
                "clientInfo": {"name": "Azure-PromptFlow-BCSummit-Client", "version": "1.0.0"}
            },
            "id": 1
        }

        try:
            logger.info("Inicializando nueva sesión MCP...")
            response = requests.post(self.MCP_SERVER_URL, json=payload, headers=headers, timeout=30)

            if response.status_code == 200:
                self._session_id = response.headers.get('mcp-session-id')
                if self._session_id:
                    self._session_initialized = True
                    logger.info(f"Sesión MCP inicializada exitosamente. Session ID: {self._session_id}")
                    return True
                else:
                    logger.warning("Inicialización exitosa pero no se recibió session ID")
                    return False
            else:
                logger.error(f"Error inicializando sesión MCP: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            logger.error(f"Excepción inicializando sesión MCP: {str(e)}")
            return False

    def _reset_session(self):
        """Reinicia la sesión MCP."""
        logger.info("Reiniciando sesión MCP...")
        self._session_id = None
        self._session_initialized = False

    def _execute_create_sales_document_workflow(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Ejecuta workflow de creación de documento de venta (orden + línea)."""
        logger.info(f"Iniciando workflow de creación de documento de venta con params: {params}")
        
        customer_number = params.get("customerNumber")
        line_object_number = params.get("lineObjectNumber")
        quantity = params.get("quantity")
        
        if not customer_number or not line_object_number or not quantity:
            return {
                "error": "Parámetros requeridos faltantes: customerNumber, lineObjectNumber, quantity",
                "workflow_step": "validation"
            }
        
        # Paso 1: Crear orden de venta
        logger.info(f"Paso 1: Creando orden de venta para cliente {customer_number}")
        order_params = {"customerNumber": customer_number}
        order_result = self._call_tool("create-sales-order", order_params)
        
        if "error" in order_result:
            return {
                "error": f"Error creando orden de venta: {order_result['error']}",
                "workflow_step": "create_order",
                "order_result": order_result
            }
        
        # Extraer ID de la orden creada
        order_id = None
        try:
            # Buscar en structuredContent primero (más fácil de parsear)
            if "result" in order_result and "structuredContent" in order_result["result"]:
                structured_content = order_result["result"]["structuredContent"]
                if "order" in structured_content and "id" in structured_content["order"]:
                    order_id = structured_content["order"]["id"]
                    logger.info(f"ID extraído de structuredContent: {order_id}")
            
            # Si no se encontró en structuredContent, buscar en content/text
            if not order_id and "result" in order_result and "content" in order_result["result"]:
                for content_item in order_result["result"]["content"]:
                    if content_item.get("type") == "text":
                        # Parsear JSON de la respuesta
                        import json
                        order_data = json.loads(content_item.get("text", "{}"))
                        if "order" in order_data and "id" in order_data["order"]:
                            order_id = order_data["order"]["id"]
                            logger.info(f"ID extraído de content/text: {order_id}")
                            break
            
            if not order_id:
                return {
                    "error": "No se pudo extraer el ID de la orden creada",
                    "workflow_step": "extract_order_id",
                    "order_result": order_result
                }
                
        except Exception as e:
            return {
                "error": f"Error extrayendo ID de orden: {str(e)}",
                "workflow_step": "extract_order_id",
                "order_result": order_result
            }
        
        logger.info(f"Paso 1 completado: Orden creada con ID {order_id}")
        
        # Paso 2: Crear línea de orden
        logger.info(f"Paso 2: Creando línea para orden {order_id}")
        line_params = {
            "orderId": order_id,
            "lineObjectNumber": line_object_number,
            "quantity": quantity
        }
        line_result = self._call_tool("create-sales-order-line", line_params)
        
        if "error" in line_result:
            return {
                "error": f"Error creando línea de orden: {line_result['error']}",
                "workflow_step": "create_order_line",
                "order_result": order_result,
                "order_id": order_id,
                "line_result": line_result
            }
        
        logger.info("Paso 2 completado: Línea de orden creada exitosamente")
        
        # Retornar resultado combinado
        return {
            "success": True,
            "workflow_type": "create_sales_document",
            "workflow_steps_completed": ["create_order", "create_order_line"],
            "order_id": order_id,
            "customer_number": customer_number,
            "line_object_number": line_object_number,
            "quantity": quantity,
            "order_result": order_result,
            "line_result": line_result
        }

    def _call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Ejecuta una llamada a una herramienta MCP."""
        # Asegurar que la sesión esté inicializada
        if not self._initialize_session():
            return {"error": "No se pudo inicializar la sesión MCP"}

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "User-Agent": "Azure-PromptFlow-BCSummit-Client/1.0",
            "mcp-session-id": self._session_id
        }

        payload = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            },
            "id": 2
        }

        max_retries = 2
        for attempt in range(max_retries):
            try:
                logger.info(f"Llamando herramienta MCP: {tool_name} con argumentos: {arguments} (intento {attempt + 1}/{max_retries})")
                response = requests.post(self.MCP_SERVER_URL, json=payload, headers=headers, timeout=60)

                if response.status_code == 200:
                    return self._parse_response(response)
                else:
                    logger.error(f"HTTP {response.status_code}: {response.text}")

                    # Si es error de sesión, reinicializar y retry
                    if response.status_code == 400 and "Invalid Request" in response.text:
                        logger.info("Error de sesión detectado, reinicializando...")
                        self._reset_session()
                        if attempt < max_retries - 1:
                            continue

                    return {"error": f"HTTP {response.status_code}: {response.text}"}

            except requests.exceptions.Timeout as e:
                logger.warning(f"Timeout en intento {attempt + 1}/{max_retries} para {tool_name}: {str(e)}")
                if attempt < max_retries - 1:
                    logger.info(f"Reintentando tras timeout en {attempt + 1} segundos...")
                    time.sleep(attempt + 1)
                    continue
                return {"error": f"Timeout después de {max_retries} intentos: {str(e)}"}

            except requests.exceptions.RequestException as e:
                logger.error(f"Error de conexión en intento {attempt + 1}: {str(e)}")
                if attempt < max_retries - 1:
                    logger.info(f"Reintentando tras error de conexión en {attempt + 2} segundos...")
                    time.sleep(attempt + 2)
                    continue
                return {"error": f"Error de conexión con servidor MCP: {str(e)}"}

            except Exception as e:
                logger.error(f"Error inesperado en intento {attempt + 1}: {str(e)}")
                if attempt == max_retries - 1:
                    return {"error": f"Error inesperado: {str(e)}"}

        return {"error": "Todos los intentos fallaron"}

    def _parse_response(self, response: requests.Response) -> Dict[str, Any]:
        """Parsea la respuesta del servidor MCP."""
        content_type = response.headers.get('content-type', '').lower()

        if 'application/json' in content_type:
            try:
                result = response.json()
                logger.info("Respuesta MCP JSON parseada exitosamente")
                return result
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON response: {e}")
                return {"error": f"Error parsing respuesta JSON: {str(e)}"}

        elif 'text/event-stream' in content_type:
            return self._parse_sse_response(response.text)
        else:
            logger.warning(f"Tipo de contenido inesperado: {content_type}")
            return {"error": f"Tipo de contenido inesperado: {content_type}"}

    def _parse_sse_response(self, sse_text: str) -> Dict[str, Any]:
        """Parsea respuesta SSE del servidor MCP."""
        sse_lines = sse_text.strip().split('\n')
        for line in sse_lines:
            if line.startswith('data: '):
                try:
                    result = json.loads(line[6:])
                    logger.info("Respuesta MCP SSE parseada exitosamente")
                    return result
                except json.JSONDecodeError as e:
                    logger.warning(f"Error parsing SSE line: {e}")
                    continue

        logger.warning("No se pudo parsear ninguna línea SSE válida")
        return {"error": "No se pudo parsear respuesta SSE"}

    def validate_tool_params(self, tool: MCPTool, params: Dict[str, Any]) -> Dict[str, Any]:
        """Valida los parámetros para una herramienta específica."""
        config = self.TOOL_CONFIGS[tool]

        # Verificar parámetros requeridos
        missing_params = []
        for required_param in config.required_params:
            if required_param not in params or params[required_param] is None:
                missing_params.append(required_param)

        if missing_params:
            return {
                "valid": False,
                "error": f"Parámetros requeridos faltantes: {', '.join(missing_params)}",
                "required_params": config.required_params,
                "optional_params": config.optional_params
            }

        # Filtrar solo parámetros válidos
        valid_params = {}
        all_allowed_params = set(config.required_params + config.optional_params)

        for param, value in params.items():
            if param in all_allowed_params:
                valid_params[param] = value
            else:
                logger.warning(f"Parámetro no válido ignorado: {param}")

        return {
            "valid": True,
            "params": valid_params,
            "tool_config": config
        }

    def execute_tool(self, tool: MCPTool, params: Dict[str, Any]) -> Dict[str, Any]:
        """Ejecuta una herramienta MCP con validación de parámetros."""
        logger.info(f"Ejecutando herramienta: {tool.value}")

        # Workflow especial para CREATE_SALES_ORDER (doble llamada)
        if tool == MCPTool.CREATE_SALES_ORDER:
            logger.info("Detectado workflow de creación de documento de venta")
            
            # Validación especial para el workflow completo
            required_workflow_params = ["customerNumber", "lineObjectNumber", "quantity"]
            missing_params = [p for p in required_workflow_params if p not in params or params[p] is None]
            
            if missing_params:
                return {
                    "success": False,
                    "error": f"Parámetros requeridos para workflow completo faltantes: {', '.join(missing_params)}",
                    "tool": tool.value,
                    "params_used": params,
                    "required_workflow_params": required_workflow_params
                }
            
            workflow_result = self._execute_create_sales_document_workflow(params)
            return {
                "success": "error" not in workflow_result,
                "tool": tool.value,
                "params_used": params,
                "result": workflow_result,
                "workflow_type": "create_sales_document",
                "tool_config": {
                    "description": self.TOOL_CONFIGS[tool].description,
                    "required_params": required_workflow_params,  # Mostrar parámetros del workflow completo
                    "optional_params": self.TOOL_CONFIGS[tool].optional_params
                }
            }

        # Validar parámetros para herramientas normales
        validation = self.validate_tool_params(tool, params)
        if not validation["valid"]:
            logger.error(f"Validación fallida para {tool.value}: {validation['error']}")
            return {
                "success": False,
                "error": validation["error"],
                "tool": tool.value,
                "params_used": params
            }

        # Ejecutar herramienta normal
        result = self._call_tool(tool.value, validation["params"])

        return {
            "success": "error" not in result,
            "tool": tool.value,
            "params_used": validation["params"],
            "result": result,
            "tool_config": {
                "description": validation["tool_config"].description,
                "required_params": validation["tool_config"].required_params,
                "optional_params": validation["tool_config"].optional_params
            }
        }

# Instancia global del cliente MCP
_mcp_client = MCPClient()

@tool
def mcp_executor(tool_decision: str, question: str = None) -> str:
    """
    Ejecuta herramientas MCP para Business Central Summit 2025.

    Args:
        tool_decision: JSON string con la decisión del router
        question: Pregunta original del usuario

    Returns:
        JSON string con la respuesta del servidor MCP
    """
    try:
        # Parsear la decisión del router
        router_decision = json.loads(tool_decision.strip())
        workflow_type = router_decision.get("workflow_type", "none")
        tool_name = router_decision.get("tool", "").strip()
        router_params = router_decision.get("params", {})

        logger.info(f"MCP Executor - workflow='{workflow_type}', tool='{tool_name}', params={router_params}")
        logger.info(f"MCP Executor - Original question: '{question}'")

        # Determinar la herramienta MCP a usar
        try:
            tool = MCPTool(tool_name)
        except ValueError:
            logger.warning(f"Herramienta no válida: {tool_name}")
            return json.dumps({
                "success": False,
                "error": f"Herramienta MCP no válida: {tool_name}",
                "available_tools": [t.value for t in MCPTool],
                "question": question,
                "workflow_type": workflow_type
            }, ensure_ascii=False)

        # Ejecutar la herramienta
        result = _mcp_client.execute_tool(tool, router_params)

        # Crear resultado final
        final_result = {
            "workflow_type": workflow_type,
            "question": question,
            "tool_execution": result
        }

        logger.info(f"Ejecución completada para {tool_name} - Success: {result['success']}")
        return json.dumps(final_result, ensure_ascii=False)

    except json.JSONDecodeError as e:
        logger.error(f"Error parsing router decision: {e}")
        return json.dumps({
            "success": False,
            "error": f"Error parsing router decision: {e}",
            "raw_decision": tool_decision,
            "question": question
        }, ensure_ascii=False)

    except Exception as e:
        logger.error(f"Error inesperado en mcp_executor: {str(e)}")
        return json.dumps({
            "success": False,
            "error": f"Error inesperado: {str(e)}",
            "question": question
        }, ensure_ascii=False)