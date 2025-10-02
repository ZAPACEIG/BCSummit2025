
import { z } from 'zod';
import type { BusinessCentralClient } from '../services/business-central-client.js';
import { CustomerSchema } from '../types/business-central.js';
import type { Customer } from '../types/business-central.js';

const GetCustomersArgsSchema = z.object({
  no: z.string().optional().describe('Filtrar por número de cliente (no)'),
  limit: z.number().min(1).max(1000).optional().describe('Número máximo de clientes a retornar (por defecto: 100)'),
});

const GetCustomersOutputSchema = z.array(CustomerSchema);

export type GetCustomersArgs = z.infer<typeof GetCustomersArgsSchema>;

export class GetCustomersTool {
  constructor(private bcClient: BusinessCentralClient) {}


  getDefinition() {
    return {
      name: 'get-customers',
      description: 'Obtiene clientes de Business Central',
      inputSchema: GetCustomersArgsSchema,
      outputSchema: GetCustomersOutputSchema
    };
  }

  async execute(args: unknown): Promise<{ content: Array<{ type: 'json'; json: unknown; }>; structuredContent?: unknown }> {
    try {
      const validatedArgs = GetCustomersArgsSchema.parse(args);
      let filter = '';
      if (validatedArgs.no) {
        filter = `number eq '${validatedArgs.no}'`;
      }
      const params: { limit?: number; filter?: string } = { limit: validatedArgs.limit || 100 };
      if (filter) params.filter = filter;
      const customers = await this.bcClient.getCustomers(params);
      const limited = customers.slice(0, validatedArgs.limit || 100);
      const validatedOutput = GetCustomersOutputSchema.parse(limited);
      return {
        content: [{
          type: 'json',
          json: validatedOutput
        }],
        structuredContent: validatedOutput
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