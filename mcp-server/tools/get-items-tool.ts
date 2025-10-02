import { z } from 'zod';
import type { BusinessCentralClient } from '../services/business-central-client.js';
import { ItemSchema } from '../types/business-central.js';
import type { Item } from '../types/business-central.js';

const GetItemsArgsSchema = z.object({
  number: z.string().optional().describe('Filtrar por número de producto (number)'),
  itemCategoryCode: z.string().optional().describe('Filtrar por código de categoría (itemCategoryCode)'),
  limit: z.number().min(1).max(1000).optional().describe('Número máximo de productos a retornar (por defecto: 100)'),
});

const GetItemsOutputSchema = z.array(ItemSchema);

export type GetItemsArgs = z.infer<typeof GetItemsArgsSchema>;

export class GetItemsTool {
  constructor(private bcClient: BusinessCentralClient) {}

  getDefinition() {
    return {
      name: 'get-items',
      description: 'Obtiene los productos (items) de Business Central',
      inputSchema: GetItemsArgsSchema,
      outputSchema: GetItemsOutputSchema
    };
  }

  async execute(args: unknown): Promise<{ content: Array<{ type: 'json'; json: unknown; }>; structuredContent?: { [x: string]: unknown } }> {
    try {
      const validatedArgs = GetItemsArgsSchema.parse(args);
      let filter = '';
      if (validatedArgs.number) {
        filter = `number eq '${validatedArgs.number}'`;
      }
      if (validatedArgs.itemCategoryCode) {
        if (filter) filter += ' and ';
        filter += `itemCategoryCode eq '${validatedArgs.itemCategoryCode}'`;
      }
      const items = await this.bcClient.getItems(
        filter
          ? { limit: validatedArgs.limit || 100, filter }
          : { limit: validatedArgs.limit || 100 }
      );
      const limited = items.slice(0, validatedArgs.limit || 100);
      const validatedOutput = GetItemsOutputSchema.parse(limited);
      return {
        content: [{
          type: 'json',
          json: validatedOutput
        }],
        structuredContent: { items: validatedOutput }
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
