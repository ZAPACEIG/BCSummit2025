
import { z } from 'zod';
import type { BusinessCentralClient } from '../services/business-central-client.js';
import { SalesOrderLineSchema } from '../types/business-central.js';
import type { SalesOrderLine } from '../types/business-central.js';

export class GetSalesOrderLinesTool {
  constructor(private bcClient: BusinessCentralClient) {}

  getDefinition() {
    return {
      name: 'get-sales-order-lines',
      description: 'Obtiene las líneas de un pedido de venta de Business Central',
      inputSchema: {
        orderId: z.string().uuid().describe('UUID del pedido de venta (SalesOrderHeader)')
      },
      outputSchema: z.array(SalesOrderLineSchema)
    };
  }

  async execute({ orderId }: { orderId: string }): Promise<{ content: Array<{ type: 'json'; json: unknown; }>; structuredContent?: { [x: string]: unknown } }> {
    try {
      const lines = await this.bcClient.getSalesOrderLines(orderId);
      const validatedOutput = z.array(SalesOrderLineSchema).parse(lines);
      return {
        content: [{
          type: 'json',
          json: validatedOutput
        }],
        structuredContent: { lines: validatedOutput }
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
