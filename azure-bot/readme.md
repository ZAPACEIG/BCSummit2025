# BC Summit 2025 Bot

Bot inteligente para análisis y gestión de Business Central, desarrollado con Bot Framework y AI Foundry.

## 🚀 Características

- **Análisis de Clientes**: Consultas sobre información de clientes
- **Gestión de Productos**: Análisis de inventario y productos
- **Pedidos de Venta**: Gestión y seguimiento de pedidos
- **Líneas de Pedido**: Análisis detallado de líneas de venta
- **Acciones ERP**: Envío y facturación de pedidos
- **AI Foundry Integration**: Procesamiento inteligente con Azure AI

## 🏢 Tecnologías

- **TypeScript** - Lenguaje principal
- **Bot Framework** - Microsoft Bot Framework v4
- **Express.js** - Servidor HTTP
- **Azure AI Foundry** - Servicio de inteligencia artificial
- **Business Central MCP** - Integración con Business Central
- **Node.js** - Runtime de JavaScript

## 📋 Requisitos Previos

- Node.js >= 16.0.0
- npm >= 8.0.0
- Azure Bot Service
- Azure AI Foundry endpoint
- Business Central MCP Server

## ⚙️ Instalación

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   
   Crear archivo `.env` en la raíz del proyecto:
   ```env
   # Bot Configuration
   MicrosoftAppId=be3a88fe-bc9a-48af-b807-942682d2f9bd
   MicrosoftAppPassword=J5E8Q~iyfYJVMpN7DjipNcAOFWemNQETm8Q0Ubzo
   MicrosoftAppType=SingleTenant
   MicrosoftAppTenantId=58b72900-95d2-4c65-b186-fe515140c70a

   # Server Configuration
   PORT=3978

   # AI Foundry Integration
   AI_FOUNDRY_ENDPOINT=your-ai-foundry-endpoint
   AI_FOUNDRY_KEY=your-ai-foundry-key
   AI_FOUNDRY_FLOW_NAME=Flow-BCSummit
   AI_FOUNDRY_DEPLOYMENT=bcsummit-flow-1
   ```

3. **Compilar el proyecto**
   ```bash
   npm run build
   ```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El bot estará disponible en: `http://localhost:3978`

## 🧪 Pruebas

### Bot Framework Emulator
1. Descargar [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator)
2. Conectar a: `http://localhost:3978/api/messages`
3. Configurar credenciales si es necesario

### Health Check
```bash
curl http://localhost:3978/health
```

## 📁 Estructura del Proyecto

```
Azure Bot/
├── src/
│   ├── bot.ts                    # Clase principal del bot
│   ├── index.ts                  # Punto de entrada y configuración del servidor
│   └── services/
│       └── ai-foundry-service.ts # Integración con Azure AI Foundry
├── lib/                          # Archivos compilados
├── .env                          # Variables de entorno
├── package.json                  # Configuración de npm
├── tsconfig.json                 # Configuración de TypeScript
└── README.md                     # Este archivo
```

## 🤖 Comandos del Bot

### Comandos Especiales
- `hola` / `hello` / `hi` - Mensaje de bienvenida
- `help` / `ayuda` / `?` - Guía de uso

### Ejemplos de Consultas
- "¿Cuántos clientes tenemos activos?"
- "Muéstrame los productos con stock bajo"
- "Listado de pedidos pendientes de envío"
- "¿Cuál es el estado del pedido SO-2024-001?"
- "Enviar y facturar el pedido SO-2024-002"

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run build` | Compila TypeScript a JavaScript |
| `npm run dev` | Ejecuta en modo desarrollo con recarga automática |
| `npm start` | Ejecuta la aplicación compilada |
| `npm run clean` | Limpia archivos compilados |

## 🌐 Endpoints

| Endpoint | Método | Descripción |
|----------|---------|-------------|
| `/api/messages` | POST | Endpoint principal del bot |
| `/health` | GET | Health check del servicio |

## 🔧 Configuración de Azure

### Bot Service
1. Crear Azure Bot Service
2. Configurar App Registration (SingleTenant)
3. Obtener App ID, Password y Tenant ID

### AI Foundry
1. Configurar endpoint de AI Foundry
2. Obtener API key
3. Configurar flow name y deployment

## 🐳 Docker

```dockerfile
# Ejecutar con Docker
docker build -t bcsummit-bot .
docker run -p 3978:3978 --env-file .env bcsummit-bot
```

## Redespliegue

Cada vez que realices cambios en el código del BOT y quieras subirlos a Azure, ejecuta los siguientes comandos desde la raíz del proyecto:

```bash
docker build -t bcsummit-bot .
docker tag bcsummit-bot crbcsummitmcpeus2001.azurecr.io/bcsummit-bot:latest
az acr login --name crbcsummitmcpeus2001
docker push crbcsummitmcpeus2001.azurecr.io/bcsummit-bot:latest
az containerapp update --name ca-bcsummit-bot-eus2-001 --resource-group rg-bcsummit --image crbcsummitmcpeus2001.azurecr.io/bcsummit-bot:latest

# Reiniciar Container
# Detener la aplicación contenedora a mano y la vuelvo a iniciar en el portal de Azure
```

Para ver las variables:
```bash
az containerapp show --name ca-bcsummit-bot-eus2-001 --resource-group rg-bcsummit --query "properties.template.containers[0].env" --output table

az containerapp update --name ca-bcsummit-bot-eus2-001 --resource-group rg-bcsummit --set-env-vars AI_FOUNDRY_ENDPOINT=https://bcsummit-flow.eastus.inference.ml.azure.com/score AI_FOUNDRY_KEY=your-key AI_FOUNDRY_DEPLOYMENT=bcsummit-flow-1

az containerapp update --name ca-bcsummit-bot-eus2-001 --resource-group rg-bcsummit --replace-env-vars AI_FOUNDRY_FLOW_NAME=bcsummit-flow

az containerapp update --name ca-bcsummit-bot-eus2-001 --resource-group rg-bcsummit --set-env-vars MicrosoftAppId=be3a88fe-bc9a-48af-b807-942682d2f9bd MicrosoftAppPassword=J5E8Q~iyfYJVMpN7DjipNcAOFWemNQETm8Q0Ubzo MicrosoftAppType=SingleTenant MicrosoftAppTenantId=58b72900-95d2-4c65-b186-fe515140c70a PORT=3978
```

---

## 🛠️ Desarrollo

### Configuración del IDE
- Instalar extensión TypeScript para VS Code
- Configurar ESLint y Prettier (opcional)
- Usar configuración de tsconfig.json incluida

### Estructura de Código
- **Separación de responsabilidades**: Cada servicio en su propio archivo
- **Tipado fuerte**: TypeScript con interfaces definidas
- **Error handling**: Manejo centralizado de errores
- **Logging**: Sistema de logs estructurado

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🏢 Empresa

Desarrollado por **Ayesa Ibermática** para el **BC Summit 2025**.

## 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo:
- Email: soporte@ayesa.com
- Documentación: [Wiki del proyecto](../../wiki)

---

**Versión**: 1.0.0  
**Última actualización**: Septiembre 2025