#!/usr/bin/env node

import express from "express";
import logger from "./config/logger.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";

import { BusinessCentralClient } from "./services/business-central-client.js";
import { registerAllTools } from "./tools/register.js";

dotenv.config();

const server = new McpServer({
  name: "business-central-mcp-server",
  version: "1.0.0",
});

const bcClient = new BusinessCentralClient({
  businessCentral: {
    baseUrl: process.env['BC_BASE_URL'] || "https://api.businesscentral.dynamics.com",
    tenantId: process.env['BC_TENANT_ID'] || "",
    environment: process.env['BC_ENVIRONMENT'] || "Sandbox",
    companyId: process.env['BC_COMPANY_ID'] || "",
    apiVersion: process.env['BC_API_VERSION'] || "v2.0"
  },
  auth: {
    clientId: process.env['BC_CLIENT_ID'] || '',
    clientSecret: process.env['BC_CLIENT_SECRET'] || '',
    scope: process.env['OAUTH_SCOPE'] || 'https://api.businesscentral.dynamics.com/.default'
  }
} as any);

registerAllTools(server, bcClient);


const app = express();
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, headers: req.headers }, 'Nueva petición HTTP');
  next();
});

const transports: Record<string, StreamableHTTPServerTransport> = {};

app.all('/mcp', async (req, res, next) => {
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (req.method === 'POST' && req.body?.method === 'initialize') {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          transports[sessionId] = transport;
        }
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          delete transports[sid];
        }
      };

      await server.connect(transport);
    } else {
      res.status(400).json({ error: 'Invalid Request' });
      return;
    }

    await transport.handleRequest(req as any, res as any, req.body);
  } catch (error) {
    logger.error({ err: error }, 'Error en endpoint /mcp');
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
    next(error);
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

const PORT = process.env['PORT'] || 3000;
app.listen(PORT, () => {
  logger.info(`✅ Business Central MCP Server listening on port ${PORT}`);
  logger.info(`🌐 MCP endpoint:    http://localhost:${PORT}/mcp`);
  logger.info(`🔍 Health check:    http://localhost:${PORT}/health`);
  logger.info(`🏠 API info:        http://localhost:${PORT}/`);
  logger.info('🎉 Server ready for AI Foundry integration!');
});