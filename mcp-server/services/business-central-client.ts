import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { MCPServerConfig } from '../types/config.js';
import {
  CustomersResponseSchema,
  ItemsResponseSchema,
  SalesOrderLinesResponseSchema,
  SalesOrderLineSchema,
  SalesOrderHeaderSchema,
  SalesOrdersResponseSchema,
  GetCustomersParamsSchema,
  SalesOrderLineCreateRequestSchema,
  SalesOrderCreateRequestSchema
} from '../types/business-central.js';

import type {
  Customer,
  Item,
  SalesOrderLine,
  SalesOrderHeader
} from '../types/business-central.js';

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class BusinessCentralClient {

  async getCustomers(params: { filter?: string, limit?: number } = {}): Promise<Customer[]> {
    try {
      GetCustomersParamsSchema.parse(params);
      let url = '/customers?$top=' + (params.limit || 100);
      if (params.filter) {
        url += `&$filter=${encodeURIComponent(params.filter)}`;
      }
      console.log(`[BC API] Calling: ${this.buildBaseUrl()}${url}`);
      const response = await this.httpClient.get(url);
      console.log(`[BC API] Response status: ${response.status}`);
      const validatedResponse = CustomersResponseSchema.parse(response.data);
      return validatedResponse.value;
    } catch (error) {
      console.error('[BC API] Error in getCustomers:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[BC API] Response status:', error.response.status);
        console.error('[BC API] Response data:', error.response.data);
      }
      throw error;
    }
  }

  async getItems(params: { filter?: string, limit?: number } = {}): Promise<Item[]> {
    try {
      let url = '/items?$top=' + (params.limit || 100);
      if (params.filter) {
        url += `&$filter=${encodeURIComponent(params.filter)}`;
      }
      console.log(`[BC API] Calling: ${this.buildBaseUrl()}${url}`);
      const response = await this.httpClient.get(url);
      console.log(`[BC API] Response status: ${response.status}`);
      const validatedResponse = ItemsResponseSchema.parse(response.data);
      return validatedResponse.value;
    } catch (error) {
      console.error('[BC API] Error in getItems:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[BC API] Response status:', error.response.status);
        console.error('[BC API] Response data:', error.response.data);
      }
      throw error;
    }
  }

  async getSalesOrders(params: { filter?: string, limit?: number } = {}): Promise<SalesOrderHeader[]> {
    try {
      let url = '/salesOrders?$top=' + (params.limit || 100);
      if (params.filter) {
        url += `&$filter=${encodeURIComponent(params.filter)}`;
      }
      console.log(`[BC API] Calling: ${this.buildBaseUrl()}${url}`);
      const response = await this.httpClient.get(url);
      console.log(`[BC API] Response status: ${response.status}`);
      const validatedResponse = SalesOrdersResponseSchema.parse(response.data);
      return validatedResponse.value;
    } catch (error) {
      console.error('[BC API] Error in getSalesOrders:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[BC API] Response status:', error.response.status);
        console.error('[BC API] Response data:', error.response.data);
      }
      throw error;
    }
  }

  async getSalesOrderLines(orderId: string): Promise<SalesOrderLine[]> {
    try {
      const url = `/salesOrders(${orderId})/salesOrderLines`;
      console.log(`[BC API] Calling: ${this.buildBaseUrl()}${url}`);
      const response = await this.httpClient.get(url);
      console.log(`[BC API] Response status: ${response.status}`);
      const validatedResponse = SalesOrderLinesResponseSchema.parse(response.data);
      return validatedResponse.value;
    } catch (error) {
      console.error('[BC API] Error in getSalesOrderLines:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[BC API] Response status:', error.response.status);
        console.error('[BC API] Response data:', error.response.data);
      }
      throw error;
    }
  }

  async createSalesOrder(customerNumber: string): Promise<SalesOrderHeader> {
    try {
      const url = '/salesOrders';
      SalesOrderCreateRequestSchema.parse({ customerNumber });
      const payload = { customerNumber };
      console.log(`[BC API] POST: ${this.buildBaseUrl()}${url}`);
      const response = await this.httpClient.post(url, payload);
      const validatedResponse = SalesOrderHeaderSchema.parse(response.data);
      return validatedResponse;
    } catch (error) {
      console.error('[BC API] Error in createSalesOrder:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[BC API] Response status:', error.response.status);
        console.error('[BC API] Response data:', error.response.data);
      }
      throw error;
    }
  }

  async createSalesOrderLine(orderId: string, lineObjectNumber: string, quantity: number): Promise<SalesOrderLine> {
    try {
      const url = `/salesOrders(${orderId})/salesOrderLines`;
      const payload = {
        lineType: 'Item',
        lineObjectNumber,
        quantity
      };
      SalesOrderLineCreateRequestSchema.parse({ lineType: 'Item', lineObjectNumber, quantity });
      console.log(`[BC API] POST: ${this.buildBaseUrl()}${url}`);
      const response = await this.httpClient.post(url, payload);
      const validatedResponse = SalesOrderLineSchema.parse(response.data);
      return validatedResponse;
    } catch (error) {
      console.error('[BC API] Error in createSalesOrderLine:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[BC API] Response status:', error.response.status);
        console.error('[BC API] Response data:', error.response.data);
      }
      throw error;
    }
  }

  async shipAndInvoiceOrder(orderId: string): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const url = `/salesOrders(${orderId})/Microsoft.NAV.shipAndInvoice`;
      console.log(`[BC API] POST: ${this.buildBaseUrl()}${url}`);
      const response = await this.httpClient.post(url);
      return {
        success: true,
        message: 'Pedido enviado y facturado correctamente',
        data: response.data
      };
    } catch (error) {
      console.error('[BC API] Error in shipAndInvoiceOrder:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: `Error ${error.response.status}: ${JSON.stringify(error.response.data)}`
        };
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  private httpClient: AxiosInstance;
  private config: MCPServerConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: this.buildBaseUrl(),
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    this.httpClient.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.accessToken) {
        config.headers['Authorization'] = `Bearer ${this.accessToken}`;
      }
      return config;
    });
  }

  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return;
    }
    await this.refreshAccessToken();
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.config.businessCentral.tenantId}/oauth2/v2.0/token`;
      console.log(`[BC OAuth] Requesting token from: ${tokenUrl}`);
      
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.config.auth.clientId);
      params.append('client_secret', this.config.auth.clientSecret);
      params.append('scope', this.config.auth.scope || 'https://api.businesscentral.dynamics.com/.default');

      const response = await axios.post<OAuthTokenResponse>(tokenUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
      console.log(`[BC OAuth] Token obtained successfully, expires at: ${this.tokenExpiresAt.toISOString()}`);
    } catch (error) {
      console.error('[BC OAuth] Failed to get token:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[BC OAuth] Response status:', error.response.status);
        console.error('[BC OAuth] Response data:', error.response.data);
      }
      throw error;
    }
  }

  private buildBaseUrl(): string {
    const { baseUrl, tenantId, environment, companyId, apiVersion } = this.config.businessCentral;
    return `${baseUrl}/${apiVersion}/${tenantId}/${environment}/api/${apiVersion}/companies(${companyId})`;
  }
}