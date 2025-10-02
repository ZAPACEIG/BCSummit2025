import { z } from 'zod';

export const CustomerSchema = z.object({
  '@odata.etag': z.string().optional(),
  id: z.string().uuid(),
  number: z.string(),
  displayName: z.string(),
  type: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().or(z.string().length(0)).optional(),
  website: z.string().optional(),
  salespersonCode: z.string().optional(),
  balanceDue: z.number().optional(),
  creditLimit: z.number().optional(),
  taxLiable: z.boolean().optional(),
  taxAreaId: z.string().uuid().optional(),
  taxAreaDisplayName: z.string().optional(),
  taxRegistrationNumber: z.string().optional(),
  currencyId: z.string().uuid().optional(),
  currencyCode: z.string().optional(),
  paymentTermsId: z.string().uuid().optional(),
  shipmentMethodId: z.string().uuid().optional(),
  paymentMethodId: z.string().uuid().optional(),
  blocked: z.string().optional(),
  lastModifiedDateTime: z.string().datetime().optional()
});

export const CustomersResponseSchema = z.object({
  '@odata.context': z.string().url(),
  value: z.array(CustomerSchema)
});

export const GetCustomersParamsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  filter: z.string().optional(),
  select: z.string().optional(),
  orderby: z.string().optional()
});

export const CustomerSummarySchema = z.object({
  id: z.string(),
  number: z.string(),
  displayName: z.string(),
  city: z.string().optional(),
  country: z.string().optional(),
  email: z.string().optional(),
  balanceDue: z.number().optional(),
  currencyCode: z.string().optional(),
  lastModifiedDateTime: z.string().optional()
});

export type Customer = z.infer<typeof CustomerSchema>;
export type CustomersResponse = z.infer<typeof CustomersResponseSchema>;
export type GetCustomersParams = z.infer<typeof GetCustomersParamsSchema>;
export type CustomerSummary = z.infer<typeof CustomerSummarySchema>;

export const ItemSchema = z.object({
  '@odata.etag': z.string().optional(),
  id: z.string().uuid(),
  number: z.string(),
  displayName: z.string(),
  displayName2: z.string().optional(),
  type: z.string(),
  itemCategoryId: z.string().uuid().optional(),
  itemCategoryCode: z.string().optional(),
  blocked: z.boolean(),
  gtin: z.string().optional(),
  inventory: z.number(),
  unitPrice: z.number(),
  priceIncludesTax: z.boolean(),
  unitCost: z.number(),
  taxGroupId: z.string().uuid().optional(),
  taxGroupCode: z.string().optional(),
  baseUnitOfMeasureId: z.string().uuid().optional(),
  baseUnitOfMeasureCode: z.string().optional(),
  generalProductPostingGroupId: z.string().uuid().optional(),
  generalProductPostingGroupCode: z.string().optional(),
  inventoryPostingGroupId: z.string().uuid().optional(),
  inventoryPostingGroupCode: z.string().optional(),
  lastModifiedDateTime: z.string().datetime()
});

export const ItemsResponseSchema = z.object({
  '@odata.context': z.string().url(),
  value: z.array(ItemSchema)
});

export type Item = z.infer<typeof ItemSchema>;
export type ItemsResponse = z.infer<typeof ItemsResponseSchema>;

export const SalesOrderHeaderSchema = z.object({
  '@odata.etag': z.string().optional(),
  id: z.string().uuid(),
  number: z.string(),
  externalDocumentNumber: z.string().optional(),
  orderDate: z.string().optional(),
  postingDate: z.string().optional(),
  customerId: z.string().uuid(),
  customerNumber: z.string(),
  customerName: z.string(),
  billToName: z.string(),
  billToCustomerId: z.string().uuid(),
  billToCustomerNumber: z.string(),
  shipToName: z.string(),
  shipToContact: z.string().optional(),
  sellToAddressLine1: z.string().optional(),
  sellToAddressLine2: z.string().optional(),
  sellToCity: z.string().optional(),
  sellToCountry: z.string().optional(),
  sellToState: z.string().optional(),
  sellToPostCode: z.string().optional(),
  billToAddressLine1: z.string().optional(),
  billToAddressLine2: z.string().optional(),
  billToCity: z.string().optional(),
  billToCountry: z.string().optional(),
  billToState: z.string().optional(),
  billToPostCode: z.string().optional(),
  shipToAddressLine1: z.string().optional(),
  shipToAddressLine2: z.string().optional(),
  shipToCity: z.string().optional(),
  shipToCountry: z.string().optional(),
  shipToState: z.string().optional(),
  shipToPostCode: z.string().optional(),
  shortcutDimension1Code: z.string().optional(),
  shortcutDimension2Code: z.string().optional(),
  currencyId: z.string().uuid().optional(),
  currencyCode: z.string().optional(),
  pricesIncludeTax: z.boolean(),
  paymentTermsId: z.string().uuid().optional(),
  shipmentMethodId: z.string().uuid().optional(),
  salesperson: z.string().optional(),
  partialShipping: z.boolean(),
  requestedDeliveryDate: z.string().optional(),
  discountAmount: z.number(),
  discountAppliedBeforeTax: z.boolean(),
  totalAmountExcludingTax: z.number(),
  totalTaxAmount: z.number(),
  totalAmountIncludingTax: z.number(),
  fullyShipped: z.boolean(),
  status: z.string(),
  lastModifiedDateTime: z.string().datetime(),
  phoneNumber: z.string().optional(),
  email: z.string().optional()
});

export const SalesOrdersResponseSchema = z.object({
  '@odata.context': z.string().url(),
  value: z.array(SalesOrderHeaderSchema)
});

export type SalesOrderHeader = z.infer<typeof SalesOrderHeaderSchema>;
export type SalesOrdersResponse = z.infer<typeof SalesOrdersResponseSchema>;

export const SalesOrderLineSchema = z.object({
  '@odata.etag': z.string().optional(),
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  sequence: z.number(),
  itemId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  lineType: z.string(),
  lineObjectNumber: z.string().optional(),
  description: z.string().optional(),
  description2: z.string().optional(),
  unitOfMeasureId: z.string().uuid().optional(),
  unitOfMeasureCode: z.string().optional(),
  quantity: z.number(),
  unitPrice: z.number(),
  discountAmount: z.number(),
  discountPercent: z.number(),
  discountAppliedBeforeTax: z.boolean(),
  amountExcludingTax: z.number(),
  taxCode: z.string().optional(),
  taxPercent: z.number().optional(),
  totalTaxAmount: z.number(),
  amountIncludingTax: z.number(),
  invoiceDiscountAllocation: z.number(),
  netAmount: z.number(),
  netTaxAmount: z.number(),
  netAmountIncludingTax: z.number(),
  shipmentDate: z.string().optional(),
  shippedQuantity: z.number(),
  invoicedQuantity: z.number(),
  invoiceQuantity: z.number(),
  shipQuantity: z.number(),
  itemVariantId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional()
});

export const SalesOrderLinesResponseSchema = z.object({
  '@odata.context': z.string().url(),
  value: z.array(SalesOrderLineSchema)
});

export type SalesOrderLine = z.infer<typeof SalesOrderLineSchema>;
export type SalesOrderLinesResponse = z.infer<typeof SalesOrderLinesResponseSchema>;

export const SalesOrderCreateRequestSchema = z.object({
  customerNumber: z.string()
});

export const SalesOrderCreateResponseSchema = SalesOrderHeaderSchema;
export type SalesOrderCreateRequest = z.infer<typeof SalesOrderCreateRequestSchema>;
export type SalesOrderCreateResponse = z.infer<typeof SalesOrderCreateResponseSchema>;

export const SalesOrderLineCreateRequestSchema = z.object({
  lineType: z.literal('Item'),
  lineObjectNumber: z.string(),
  quantity: z.number()
});

export const SalesOrderLineCreateResponseSchema = SalesOrderLineSchema;
export type SalesOrderLineCreateRequest = z.infer<typeof SalesOrderLineCreateRequestSchema>;
export type SalesOrderLineCreateResponse = z.infer<typeof SalesOrderLineCreateResponseSchema>;