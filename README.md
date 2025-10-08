# BC Summit 2025

**Agente conversacional inteligente para Microsoft Dynamics 365 Business Central**. Sistema completo de IA que permite consultar datos y ejecutar operaciones transaccionales en Business Central mediante lenguaje natural.

## 🏗️ Arquitectura del Sistema

### 📁 `/mcp-server` - Servidor MCP Business Central
**API Bridge** desarrollado en TypeScript que conecta con Business Central a través de REST APIs.

- **Funcionalidad**: Expone 7 herramientas MCP para consultas (clientes, productos, pedidos) y operaciones (crear pedidos, envío/facturación)
- **Azure**: Desplegado en Container Apps con registro ACR y Log Analytics
- **Actualización**: Build automático con `az acr build` y update de Container App

#### Implementación en Azure

##### Recursos Azure
- **Resource Group**: `rg-bcsummit`
- **Container Registry**: `crbcsummitmcpeus2001`
- **Log Analytics**: `log-bcsummit-mcp-eus2-001`
- **Container App Environment**: `cae-bcsummit-mcp-eus2-001`
- **Container App**: `ca-bcsummit-mcp-eus2-001`

##### Despliegue paso a paso (PowerShell)

###### 1. Crear Resource Group
```powershell
az group create --name rg-bcsummit --location eastus2
```

###### 2. Crear Container Registry
```powershell
az acr create --resource-group rg-bcsummit --name crbcsummitmcpeus2001 --sku Basic --admin-enabled true
```

###### 3. Crear Log Analytics
```powershell
az monitor log-analytics workspace create --resource-group rg-bcsummit --workspace-name log-bcsummit-mcp-eus2-001 --location eastus2
```

###### 4. Crear Container App Environment
```powershell
$workspaceId = az monitor log-analytics workspace show --resource-group rg-bcsummit --workspace-name log-bcsummit-mcp-eus2-001 --query customerId -o tsv
$workspaceKey = az monitor log-analytics workspace get-shared-keys --resource-group rg-bcsummit --workspace-name log-bcsummit-mcp-eus2-001 --query primarySharedKey -o tsv
az containerapp env create --name cae-bcsummit-mcp-eus2-001 --resource-group rg-bcsummit --location eastus2 --logs-workspace-id $workspaceId --logs-workspace-key $workspaceKey
```

###### 5. Build & Push Docker Image
```powershell
az acr login --name crbcsummitmcpeus2001
cd mcp-server
docker build -t crbcsummitmcpeus2001.azurecr.io/bcsummit-mcp:latest .
docker push crbcsummitmcpeus2001.azurecr.io/bcsummit-mcp:latest
```

###### 6. Crear Container App
```powershell
az containerapp create --name ca-bcsummit-mcp-eus2-001 --resource-group rg-bcsummit --environment cae-bcsummit-mcp-eus2-001 --image crbcsummitmcpeus2001.azurecr.io/bcsummit-mcp:latest --target-port 3000 --ingress external --registry-server crbcsummitmcpeus2001.azurecr.io --env-vars BC_CLIENT_ID=aa35324d-c0e8-4710-afa7-902c875b9f6f3 BC_CLIENT_SECRET=LKa8Q~8VDTNdA8f5jKVaNnjghSlZ~RNK3OVnmbr3 BC_TENANT_ID=1931015f-500c-4c1f-b5ec-0a341e4b197d BC_COMPANY_ID=444afd79-7588-f011-b9e7-6045bde98cf6 BC_ENVIRONMENT=IplusD BC_BASE_URL=https://api.businesscentral.dynamics.com BC_API_VERSION=v2.0 PORT=3000 NODE_ENV=production
```

##### Actualización en Azure
```powershell
az acr login --name crbcsummitmcpeus2001
cd mcp-server
docker build -t crbcsummitmcpeus2001.azurecr.io/bcsummit-mcp:latest .
docker push crbcsummitmcpeus2001.azurecr.io/bcsummit-mcp:latest
az containerapp update --name ca-bcsummit-mcp-eus2-001 --resource-group rg-bcsummit --image crbcsummitmcpeus2001.azurecr.io/bcsummit-mcp:latest
```
##### Actualización de variables de entorno
```powershell
az containerapp show --name ca-bcsummit-mcp-eus2-001 --resource-group rg-bcsummit --query properties.template.containers[0].env

az containerapp update --name ca-bcsummit-mcp-eus2-001 --resource-group rg-bcsummit --set-env-vars BC_CLIENT_ID=aa35324d-c0e8-4710-afa7-902c875b9f6f BC_CLIENT_SECRET=LKa8Q~8VDTNdA8f5jKVaNnjghSlZ~RNK3OVnmbr3 BC_TENANT_ID=1931015f-500c-4c1f-b5ec-0a341e4b197d BC_COMPANY_ID=f768a86f-0199-f011-a7af-6045bdaccd6b BC_ENVIRONMENT=IplusD BC_BASE_URL=https://api.businesscentral.dynamics.com BC_API_VERSION=v2.0 PORT=3000 NODE_ENV=production
```

### 📁 `/flow` - AI Foundry Prompt Flow
**Motor de IA** con plantillas Jinja2 profesionales para formatear respuestas empresariales de Business Central.

- **Funcionalidad**: Procesa consultas con IA, formatea respuestas con tablas/KPIs empresariales, integra con MCP Server
- **Azure**: Desplegado en AI Foundry con endpoint ML y flow management
- **Actualización**: Deploy directo desde AI Foundry Studio con versionado automático

```bash
# Configuración AI Foundry
Endpoint: https://bcsummit2025-flow.eastus.inference.ml.azure.com/score
Flow: bcsummit2025-flow-1
```

### 📁 `/azure-bot` - Bot Framework v4
**Interfaz conversacional** con Bot Framework v4 que integra AI Foundry para procesamiento inteligente.

- **Funcionalidad**: Bot multicanal (Teams, WebChat, etc.), procesamiento en lenguaje natural, integración completa AI Foundry
- **Azure**: Bot Service + Container Apps con App Registration multiinquilino y Managed Identity
- **Actualización**: ACR build y update de Container App con variables de entorno

#### 1. Configuración Local (sin autenticación)
Para desarrollo y testing con Bot Framework Emulator:

```env
# Bot Configuration - DESARROLLO LOCAL
MicrosoftAppId=
MicrosoftAppPassword=
MicrosoftAppType=
MicrosoftAppTenantId=

# AI Foundry Integration
AI_FOUNDRY_ENDPOINT=https://bcsummit2025-flow.eastus.inference.ml.azure.com/score
AI_FOUNDRY_KEY=2Uq9Gj0tHgtPd2STmBn699WnV8a2mhpzolskoFki6y3oEOUnpi71JQQJ99BIAAAAAAAAAAAAINFRAZML2IgB
AI_FOUNDRY_FLOW_NAME=bcsummit2025-flow
AI_FOUNDRY_DEPLOYMENT=bcsummit2025-flow-1
PORT=3978
```

#### 2. Configuración de Producción
Para despliegue en Azure:

```env
# Bot Configuration - PRODUCCIÓN AZURE
MicrosoftAppId=6c9e99d3-3155-4d9a-976d-9bc353a1202a
MicrosoftAppPassword=lg48Q~XtUPISE5LAEqZ9LvsMrkaKzHIQ.SIiJcRh
MicrosoftAppType=UserAssignedMSI
MicrosoftAppTenantId=58b72900-95d2-4c65-b186-fe515140c70a

# AI Foundry Integration
AI_FOUNDRY_ENDPOINT=https://bcsummit2025-flow.eastus.inference.ml.azure.com/score
AI_FOUNDRY_KEY=2Uq9Gj0tHgtPd2STmBn699WnV8a2mhpzolskoFki6y3oEOUnpi71JQQJ99BIAAAAAAAAAAAAINFRAZML2IgB
AI_FOUNDRY_FLOW_NAME=bcsummit2025-flow
AI_FOUNDRY_DEPLOYMENT=bcsummit2025-flow-1
PORT=3978
```

### Proceso de Despliegue Completo

#### Paso 1: Crear App Registration MultiTenant

1. **Ir a Azure Portal** → App registrations → New registration
2. **Configurar**:
   - **Name**: `BC Summit Bot MultiTenant`
   - **Supported account types**: `Accounts in any organizational directory (Any Azure AD directory - Multitenant)`
   - **Redirect URI**: (Dejar vacío)
3. **Crear client secret**:
   - Ir a **Certificates & secrets** → **New client secret**
   - Copiar el **Value** del secret
4. **Anotar**:
   - **Application (client) ID**: `6c9e99d3-3155-4d9a-976d-9bc353a1202a`
   - **Client Secret**: `lg48Q~XtUPISE5LAEqZ9LvsMrkaKzHIQ.SIiJcRh`

#### Paso 2: Crear Azure Container Registry

```powershell
az acr create --name acrbcsummit2025eus001 --resource-group rg-bcsummit --sku Basic --admin-enabled true --location eastus
```

#### Paso 3: Crear Container Apps Environment

```powershell
az containerapp env create --name cae-bcsummit-eus-001 --resource-group rg-bcsummit --location eastus
```

#### Paso 4: Construir y subir imagen Docker

```powershell
# Login al registry
az acr login --name acrbcsummit2025eus001

# Navegar al directorio del bot
cd "Azure Bot"

# Construir y subir imagen usando ACR Build
az acr build --registry acrbcsummit2025eus001 --image bcsummit-bot:latest .
```

#### Paso 5: Crear Container App

```powershell
az containerapp create --name ca-bcsummit-bot-eus-001 --resource-group rg-bcsummit --environment cae-bcsummit-eus-001 --image acrbcsummit2025eus001.azurecr.io/bcsummit-bot:latest --target-port 3978 --ingress external --registry-server acrbcsummit2025eus001.azurecr.io --env-vars "MicrosoftAppId=6c9e99d3-3155-4d9a-976d-9bc353a1202a" "MicrosoftAppPassword=lg48Q~XtUPISE5LAEqZ9LvsMrkaKzHIQ.SIiJcRh" "MicrosoftAppType=UserAssignedMSI" "MicrosoftAppTenantId=58b72900-95d2-4c65-b186-fe515140c70a" "AI_FOUNDRY_ENDPOINT=https://bcsummit2025-flow.eastus.inference.ml.azure.com/score" "AI_FOUNDRY_KEY=2Uq9Gj0tHgtPd2STmBn699WnV8a2mhpzolskoFki6y3oEOUnpi71JQQJ99BIAAAAAAAAAAAAINFRAZML2IgB" "AI_FOUNDRY_FLOW_NAME=bcsummit2025-flow" "AI_FOUNDRY_DEPLOYMENT=bcsummit2025-flow-1" "PORT=3978"
```

#### Paso 6: Crear Azure Bot Service

```powershell
az bot create --name bot-ai-bcsummit-eus-001 --resource-group rg-bcsummit --app-type UserAssignedMSI --appid "6c9e99d3-3155-4d9a-976d-9bc353a1202a" --tenant-id "58b72900-95d2-4c65-b186-fe515140c70a" --msi-resource-id "/subscriptions/5faae817-918f-4b3d-b9ab-e4a5b94f13c0/resourceGroups/rg-bcsummit/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-bcsummit2025-eus-001" --endpoint "https://ca-bcsummit-bot-eus-001.ashyplant-62add507.eastus.azurecontainerapps.io/api/messages" --display-name "BC Summit 2025 Bot"
```

#### Paso 7: Actualizar endpoint del bot (si es necesario)

```powershell
az bot update --name bot-ai-bcsummit-eus-001 --resource-group rg-bcsummit --endpoint "https://ca-bcsummit-bot-eus-001.ashyplant-62add507.eastus.azurecontainerapps.io/api/messages"
```

### URLs de Acceso

- **Container App**: https://ca-bcsummit-bot-eus-001.ashyplant-62add507.eastus.azurecontainerapps.io/
- **Health Check**: https://ca-bcsummit-bot-eus-001.ashyplant-62add507.eastus.azurecontainerapps.io/health
- **Bot Endpoint**: https://ca-bcsummit-bot-eus-001.ashyplant-62add507.eastus.azurecontainerapps.io/api/messages

### Comandos de Desarrollo

```powershell
# Desarrollo local
npm install
npm run build
npm start

# Testing con Bot Framework Emulator (usar localhost:3978)

# Actualización en Azure
az acr login --name acrbcsummit2025eus001
az acr build --registry acrbcsummit2025eus001 --image bcsummit-bot:latest .
az containerapp update --name ca-bcsummit-bot-eus-001 --resource-group rg-bcsummit --image acrbcsummit2025eus001.azurecr.io/bcsummit-bot:latest

## 🔧 Configuraciones Clave

**Business Central API**:
- Client ID: `aa35324d-c0e8-4710-afa7-902c875b9f6f`
- Environment: `IplusD` | Company: `444afd79-7588-f011-b9e7-6045bde98cf6`

**Bot Framework**:
- App ID: `6c9e99d3-3155-4d9a-976d-9bc353a1202a`
- Endpoint: `https://ca-bcsummit-bot-eus-001.ashyplant-62add507.eastus.azurecontainerapps.io/api/messages`

**AI Foundry**:
- Deployment: `bcsummit2025-flow-1`
- Region: East US | Port: 3978 (Bot), 3000 (MCP)

## 🚀 Capacidades del Sistema

**Consultas Inteligentes**:
- "Muéstrame los clientes activos con mayor volumen"
- "¿Qué productos tienen stock crítico?"  
- "Listado de pedidos pendientes este mes"

**Operaciones Transaccionales**:
- "Crear pedido para cliente 10000 del producto 1900-S, cantidad 2"
- "Enviar y facturar el pedido SO-2024-001"
- "Generar reporte de ventas por vendedor"