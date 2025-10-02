import { z } from 'zod';
import type { BusinessCentralClient } from '../services/business-central-client.js';

const ShipAndInvoiceOrderArgsSchema = z.object({
  orderId: z.string().uuid().describe('UUID del pedido de venta (SalesOrderHeader)')
});

export type ShipAndInvoiceOrderArgs = z.infer<typeof ShipAndInvoiceOrderArgsSchema>;

export class ShipAndInvoiceOrderTool {
  constructor(private bcClient: BusinessCentralClient) {}

  getDefinition() {
    return {
      name: 'shipandinvoice-order',
      description: 'Realiza el envío y la facturación del pedido de venta indicado (acción shipAndInvoice en Business Central)',
      inputSchema: ShipAndInvoiceOrderArgsSchema,
      outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: z.any().optional()
      })
    };
  }

  async execute(args: unknown): Promise<{ content: Array<{ type: 'json'; json: unknown; }>; structuredContent?: { [x: string]: unknown } }> {
    try {
      const validatedArgs = ShipAndInvoiceOrderArgsSchema.parse(args);
      const result = await this.bcClient.shipAndInvoiceOrder(validatedArgs.orderId);
      return {
        content: [{
          type: 'json',
          json: result
        }],
        structuredContent: { shipAndInvoice: result }
      };
    } catch (error) {
      return {
        content: [{
          type: 'json',
          json: { success: false, message: error instanceof Error ? error.message : 'Error desconocido' }
        }],
        structuredContent: { success: false, message: error instanceof Error ? error.message : 'Error desconocido' }
      };
    }
  }
}
