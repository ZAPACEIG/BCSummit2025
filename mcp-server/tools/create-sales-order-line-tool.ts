
import { z } from 'zod';
import type { BusinessCentralClient } from '../services/business-central-client.js';
import { SalesOrderLineCreateRequestSchema, SalesOrderLineCreateResponseSchema } from '../types/business-central.js';

const CreateSalesOrderLineArgsSchema = SalesOrderLineCreateRequestSchema.omit({ lineType: true }).extend({ orderId: z.string().uuid().describe('UUID del pedido de venta') });
const CreateSalesOrderLineOutputSchema = SalesOrderLineCreateResponseSchema;

export type CreateSalesOrderLineArgs = z.infer<typeof CreateSalesOrderLineArgsSchema>;

export class CreateSalesOrderLineTool {
  constructor(private client: BusinessCentralClient) {}

  getDefinition() {
    return {
      name: 'create-sales-order-line',
      description: 'Crea una nueva línea de pedido de venta en Business Central. Requiere orderId, lineObjectNumber y quantity.',
      inputSchema: CreateSalesOrderLineArgsSchema,
      outputSchema: CreateSalesOrderLineOutputSchema
    };
  }

  async execute(args: unknown): Promise<{ content: Array<{ type: 'json'; json: unknown; }>; structuredContent?: { [x: string]: unknown } }> {
    try {
      const validatedArgs = CreateSalesOrderLineArgsSchema.parse(args);
      const result = await this.client.createSalesOrderLine(validatedArgs.orderId, validatedArgs.lineObjectNumber, validatedArgs.quantity);
      return {
        content: [{ type: 'json', json: result }],
        structuredContent: { line: result }
      };
    } catch (error) {
      return {
        content: [{ type: 'json', json: { error: error instanceof Error ? error.message : 'Error desconocido' } }],
        structuredContent: { error: error instanceof Error ? error.message : 'Error desconocido' }
      };
    }
  }
}
