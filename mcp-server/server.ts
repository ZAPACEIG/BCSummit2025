#!/usr/bin/env node

import express from "express";
import logger from "./config/logger.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import dotenv from "dotenv";

import { BusinessCentralClient } from "./services/business-central-client.js";
import { registerAllTools } from "./tools/register.js";
import { config } from "./services/config.js";

dotenv.config();

const server = new McpServer({
  name: "business-central-mcp-server",
  version: "1.0.0",
});

const bcClient = new BusinessCentralClient();

registerAllTools(server, bcClient);


const app = express();
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, headers: req.headers }, 'Nueva petición HTTP');
  next();
});

// Initialize MCP transport in STATELESS mode (like Test server)
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // Stateless server
});

// Setup MCP server connection BEFORE starting Express
const setupServer = async () => {
  await server.connect(transport);
  logger.info('✅ MCP Server connected to transport');
};

app.post('/mcp', async (req, res) => {
  const timestamp = new Date().toISOString();
  logger.info({ method: req.body?.method || 'unknown' }, `[${timestamp}] � Received MCP request`);
  
  try {
    await transport.handleRequest(req as any, res as any, req.body);
  } catch (error) {
    logger.error({ err: error }, `[${timestamp}] ❌ Error handling MCP request`);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});


app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'business-central-mcp-server' });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Business Central MCP Server',
    version: '1.0.0',
    endpoints: { mcp: '/mcp', health: '/health' }
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err }, 'Error global no capturado');
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    next(err);
  }
});

const cfg = config();
const PORT = cfg.PORT_NUMBER;

// Setup server and start listening
setupServer().then(() => {
  app.listen(PORT, () => {
    logger.info(`✅ Business Central MCP Server listening on port ${PORT}`);
    logger.info(`🌐 MCP endpoint:    http://localhost:${PORT}/mcp`);
    logger.info(`🔍 Health check:    http://localhost:${PORT}/health`);
    logger.info(`🏠 API info:        http://localhost:${PORT}/`);
    logger.info(`⚙️  Timeout:         ${cfg.REQUEST_TIMEOUT_MS_NUMBER}ms`);
    logger.info(`💾 Cache TTL:       ${cfg.CACHE_TTL_SECONDS_NUMBER}s`);
    logger.info('🎉 Server ready for AI Foundry integration!');
  });
}).catch((error) => {
  logger.error({ err: error }, 'Failed to setup MCP server');
  process.exit(1);
});