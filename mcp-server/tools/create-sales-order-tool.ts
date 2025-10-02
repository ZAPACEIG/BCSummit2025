
import { z } from 'zod';
import type { BusinessCentralClient } from '../services/business-central-client.js';
import { SalesOrderCreateRequestSchema, SalesOrderCreateResponseSchema } from '../types/business-central.js';

const CreateSalesOrderArgsSchema = SalesOrderCreateRequestSchema;
const CreateSalesOrderOutputSchema = SalesOrderCreateResponseSchema;

export type CreateSalesOrderArgs = z.infer<typeof CreateSalesOrderArgsSchema>;

export class CreateSalesOrderTool {
  constructor(private client: BusinessCentralClient) {}

  getDefinition() {
    return {
      name: 'create-sales-order',
      description: 'Crea un nuevo pedido de venta en Business Central. Requiere customerNumber.',
      inputSchema: CreateSalesOrderArgsSchema,
      outputSchema: CreateSalesOrderOutputSchema
    };
  }

  async execute(args: unknown): Promise<{ content: Array<{ type: 'json'; json: unknown; }>; structuredContent?: { [x: string]: unknown } }> {
    try {
      const validatedArgs = CreateSalesOrderArgsSchema.parse(args);
      const result = await this.client.createSalesOrder(validatedArgs.customerNumber);
      return {
        content: [{ type: 'json', json: result }],
        structuredContent: { order: result }
      };
    } catch (error) {
      return {
        content: [{ type: 'json', json: { error: error instanceof Error ? error.message : 'Error desconocido' } }],
        structuredContent: { error: error instanceof Error ? error.message : 'Error desconocido' }
      };
    }
  }
}
