import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BusinessCentralClient } from "../services/business-central-client.js";
import { GetCustomersTool } from "./get-customers-tool.js";
import { GetItemsTool } from "./get-items-tool.js";
import { GetSalesOrdersTool } from "./get-sales-order-tool.js";
import { GetSalesOrderLinesTool } from "./get-sales-order-lines-tool.js";
import { ShipAndInvoiceOrderTool } from "./shipandinvoice-order-tool.js";
import { CreateSalesOrderTool } from "./create-sales-order-tool.js";
import { CreateSalesOrderLineTool } from "./create-sales-order-line-tool.js";

export function registerAllTools(server: McpServer, bcClient: BusinessCentralClient) {
  console.log('🔧 Registering BC Summit MCP tools...');

  const getCustomersTool = new GetCustomersTool(bcClient);
  const defCustomers = getCustomersTool.getDefinition();
  console.log(`✅ Registering tool: ${defCustomers.name}`);
  server.registerTool(
    defCustomers.name,
    {
      title: defCustomers.name,
      description: defCustomers.description,
      inputSchema: defCustomers.inputSchema.shape
    },
    async (args: unknown) => {
      console.log(`🚀 EXECUTING get-customers with args:`, args);
      const result = await getCustomersTool.execute(args);
      const count = Array.isArray(result.structuredContent) ? result.structuredContent.length : 'N/A';
      console.log(`✅ get-customers completed, customers count:`, count);
      return {
        content: result.content.map(c => ({ type: 'text', text: JSON.stringify(c.json) })),
        structuredContent: { customers: result.structuredContent }
      };
    }
  );
  console.log(`✅ Tool registered: ${defCustomers.name}`);

  const getItemsTool = new GetItemsTool(bcClient);
  const defItems = getItemsTool.getDefinition();
  server.registerTool(
    defItems.name,
    {
      title: defItems.name,
      description: defItems.description,
      inputSchema: defItems.inputSchema.shape
    },
    async (args: unknown) => {
      const result = await getItemsTool.execute(args);
      return {
        content: result.content.map(c => ({ type: 'text', text: JSON.stringify(c.json) })),
        structuredContent: { items: result.structuredContent }
      };
    }
  );

  const getSalesOrdersTool = new GetSalesOrdersTool(bcClient);
  const defSalesOrders = getSalesOrdersTool.getDefinition();
  server.registerTool(
    defSalesOrders.name,
    {
      title: defSalesOrders.name,
      description: defSalesOrders.description,
      inputSchema: defSalesOrders.inputSchema.shape
    },
    async (args: unknown) => {
      const result = await getSalesOrdersTool.execute(args);
      return {
        content: result.content.map(c => ({ type: 'text', text: JSON.stringify(c.json) })),
        structuredContent: { orders: result.structuredContent }
      };
    }
  );

  const getSalesOrderLinesTool = new GetSalesOrderLinesTool(bcClient);
  const defSalesOrderLines = getSalesOrderLinesTool.getDefinition();
  server.registerTool(
    defSalesOrderLines.name,
    {
      title: defSalesOrderLines.name,
      description: defSalesOrderLines.description,
      inputSchema: defSalesOrderLines.inputSchema
    },
    async (args: unknown) => {
      const result = await getSalesOrderLinesTool.execute(args as { orderId: string });
      return {
        content: result.content.map(c => ({ type: 'text', text: JSON.stringify(c.json) })),
        structuredContent: { lines: result.structuredContent }
      };
    }
  );

  const shipAndInvoiceOrderTool = new ShipAndInvoiceOrderTool(bcClient);
  const defShipAndInvoice = shipAndInvoiceOrderTool.getDefinition();
  server.registerTool(
    defShipAndInvoice.name,
    {
      title: defShipAndInvoice.name,
      description: defShipAndInvoice.description,
      inputSchema: defShipAndInvoice.inputSchema.shape
    },
    async (args: unknown) => {
      const result = await shipAndInvoiceOrderTool.execute(args);
      return {
        content: result.content.map(c => ({ type: 'text', text: JSON.stringify(c.json) })),
        structuredContent: result.structuredContent
      };
    }
  );

  const createSalesOrderTool = new CreateSalesOrderTool(bcClient);
  const defCreateSalesOrder = createSalesOrderTool.getDefinition();
  server.registerTool(
    defCreateSalesOrder.name,
    {
      title: defCreateSalesOrder.name,
      description: defCreateSalesOrder.description,
      inputSchema: defCreateSalesOrder.inputSchema.shape
    },
    async (args: unknown) => {
      const result = await createSalesOrderTool.execute(args);
      return {
        content: result.content.map(c => ({ type: 'text', text: JSON.stringify(c.json) })),
        structuredContent: result.structuredContent
      };
    }
  );

  const createSalesOrderLineTool = new CreateSalesOrderLineTool(bcClient);
  const defCreateSalesOrderLine = createSalesOrderLineTool.getDefinition();
  server.registerTool(
    defCreateSalesOrderLine.name,
    {
      title: defCreateSalesOrderLine.name,
      description: defCreateSalesOrderLine.description,
      inputSchema: defCreateSalesOrderLine.inputSchema.shape
    },
    async (args: unknown) => {
      const result = await createSalesOrderLineTool.execute(args);
      return {
        content: result.content.map(c => ({ type: 'text', text: JSON.stringify(c.json) })),
        structuredContent: result.structuredContent
      };
    }
  );
}
