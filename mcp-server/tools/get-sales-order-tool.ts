import { z } from 'zod';
import type { BusinessCentralClient } from '../services/business-central-client.js';
import { SalesOrderHeaderSchema } from '../types/business-central.js';
import type { SalesOrderHeader } from '../types/business-central.js';

const GetSalesOrdersArgsSchema = z.object({
  number: z.string().optional().describe('Filtrar por número de pedido (number)'),
  limit: z.number().min(1).max(1000).optional().describe('Número máximo de pedidos a retornar (por defecto: 100)'),
});

const GetSalesOrdersOutputSchema = z.array(SalesOrderHeaderSchema);

export type GetSalesOrdersArgs = z.infer<typeof GetSalesOrdersArgsSchema>;

export class GetSalesOrdersTool {
  constructor(private bcClient: BusinessCentralClient) {}

  getDefinition() {
    return {
      name: 'get-sales-orders',
      description: 'Obtiene los pedidos de venta (cabecera) de Business Central',
      inputSchema: GetSalesOrdersArgsSchema,
      outputSchema: GetSalesOrdersOutputSchema
    };
  }

  async execute(args: unknown): Promise<{ content: Array<{ type: 'json'; json: unknown; }>; structuredContent?: { [x: string]: unknown } }> {
    try {
      const validatedArgs = GetSalesOrdersArgsSchema.parse(args);
      let filter = '';
      if (validatedArgs.number) {
        filter = `number eq '${validatedArgs.number}'`;
      }
      const orders = await this.bcClient.getSalesOrders(
        filter
          ? { limit: validatedArgs.limit || 100, filter }
          : { limit: validatedArgs.limit || 100 }
      );
      const limited = orders.slice(0, validatedArgs.limit || 100);
      const validatedOutput = GetSalesOrdersOutputSchema.parse(limited);
      return {
        content: [{
          type: 'json',
          json: validatedOutput
        }],
        structuredContent: { orders: validatedOutput }
      };
    } catch (error) {
      return {
        content: [{
          type: 'json',
          json: { error: error instanceof Error ? error.message : 'Error desconocido' }
        }],
        structuredContent: { error: error instanceof Error ? error.message : 'Error desconocido' }
      };
    }
  }
}
