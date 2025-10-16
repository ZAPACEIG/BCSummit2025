import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { config } from './config.js';
import type {
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

import {
  CustomersResponseSchema as CustomersSchema,
  ItemsResponseSchema as ItemsSchema,
  SalesOrderLinesResponseSchema as SalesOrderLinesSchema,
  SalesOrderLineSchema as SalesOrderLineSchemaValidator,
  SalesOrderHeaderSchema as SalesOrderHeaderSchemaValidator,
  SalesOrdersResponseSchema as SalesOrdersSchema,
  GetCustomersParamsSchema as GetCustomersParamsSchemaValidator,
  SalesOrderLineCreateRequestSchema as SalesOrderLineCreateRequestSchemaValidator,
  SalesOrderCreateRequestSchema as SalesOrderCreateRequestSchemaValidator
} from '../types/business-central.js';

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface ServerInfo {
  applicationFamily: string;
  platform: string;
  apiVersion: string;
  environment: string;
  company: string;
  connectionStatus: string;
  lastChecked: string;
  endpoints: string[];
  performance: {
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
}

export class BusinessCentralClient {
  private readonly cfg = config();
  private httpClient: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  
  // Cache system
  private readonly cache = new Map<string, CacheItem<any>>();
  private readonly requestTimestamps = new Map<string, number>();
  
  // Metrics tracking
  private requestMetrics = {
    totalRequests: 0,
    errorCount: 0,
    avgResponseTime: 0,
    requestTimes: [] as number[]
  };

  constructor() {
    this.httpClient = axios.create({
      baseURL: this.buildBaseUrl(),
      timeout: this.cfg.REQUEST_TIMEOUT_MS_NUMBER,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'BC-Summit-2025-MCP/1.0.0'
      }
    });

    // Request interceptor: auth + metrics start
    this.httpClient.interceptors.request.use(
      async (config) => {
        const startTime = Date.now();
        const requestId = `${config.method}-${config.url}-${startTime}`;
        this.requestTimestamps.set(requestId, startTime);
        config.headers['X-Request-ID'] = requestId;
        
        await this.ensureValidToken();
        if (this.accessToken) {
          config.headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: metrics + retry on 401
    this.httpClient.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const requestId = response.config.headers['X-Request-ID'] as string;
        const startTime = this.requestTimestamps.get(requestId) || endTime;
        const responseTime = endTime - startTime;
        
        this.requestTimestamps.delete(requestId);
        this.updateMetrics(responseTime, false);
        
        return response;
      },
      async (error: AxiosError) => {
        const endTime = Date.now();
        const requestId = error.config?.headers?.['X-Request-ID'] as string;
        const startTime = requestId ? this.requestTimestamps.get(requestId) || endTime : endTime;
        const responseTime = endTime - startTime;
        
        if (requestId) {
          this.requestTimestamps.delete(requestId);
        }
        
        this.updateMetrics(responseTime, true);

        // Auto-retry on 401 (token expired)
        if (error.response?.status === 401) {
          this.accessToken = null;
          this.tokenExpiresAt = null;
          
          if (!error.config?.headers?.['X-Retry']) {
            error.config!.headers!['X-Retry'] = 'true';
            await this.ensureValidToken();
            if (this.accessToken) {
              error.config!.headers!['Authorization'] = `Bearer ${this.accessToken}`;
            }
            return this.httpClient.request(error.config!);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  async getCustomers(params: { filter?: string, limit?: number } = {}): Promise<Customer[]> {
    try {
      GetCustomersParamsSchemaValidator.parse(params);
      let url = '/customers?$top=' + (params.limit || 100);
      if (params.filter) {
        url += `&$filter=${encodeURIComponent(params.filter)}`;
      }
      console.log(`[BC API] Calling: ${this.buildBaseUrl()}${url}`);
      const response = await this.httpClient.get(url);
      console.log(`[BC API] Response status: ${response.status}`);
      const validatedResponse = CustomersSchema.parse(response.data);
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
      const validatedResponse = ItemsSchema.parse(response.data);
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
      const validatedResponse = SalesOrdersSchema.parse(response.data);
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
      const validatedResponse = SalesOrderLinesSchema.parse(response.data);
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
      SalesOrderCreateRequestSchemaValidator.parse({ customerNumber });
      const payload = { customerNumber };
      console.log(`[BC API] POST: ${this.buildBaseUrl()}${url}`);
      const response = await this.httpClient.post(url, payload);
      const validatedResponse = SalesOrderHeaderSchemaValidator.parse(response.data);
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
      SalesOrderLineCreateRequestSchemaValidator.parse({ lineType: 'Item', lineObjectNumber, quantity });
      console.log(`[BC API] POST: ${this.buildBaseUrl()}${url}`);
      const response = await this.httpClient.post(url, payload);
      const validatedResponse = SalesOrderLineSchemaValidator.parse(response.data);
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

  // ============================================================================
  // HEALTH CHECK & DIAGNOSTICS
  // ============================================================================

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureValidToken();
      const response = await this.httpClient.get('/customers?$top=1');
      return response.status === 200;
    } catch (error) {
      console.error('[BC API] Connection test failed:', error);
      return false;
    }
  }

  async getServerInfo(): Promise<ServerInfo> {
    const isHealthy = await this.testConnection();
    const metrics = this.getMetrics();
    
    return {
      applicationFamily: 'Microsoft Dynamics 365 Business Central',
      platform: 'Cloud',
      apiVersion: this.cfg.BC_API_VERSION,
      environment: this.cfg.BC_ENVIRONMENT,
      company: this.cfg.BC_COMPANY_ID,
      connectionStatus: isHealthy ? 'Connected' : 'Disconnected',
      lastChecked: new Date().toISOString(),
      endpoints: [
        '/customers',
        '/items',
        '/salesOrders',
        '/salesOrderLines'
      ],
      performance: {
        averageResponseTime: metrics.avgResponseTime,
        requestsPerMinute: metrics.totalRequests > 0 ? (metrics.totalRequests / (process.uptime() / 60)) : 0,
        errorRate: metrics.totalRequests > 0 ? (metrics.errorCount / metrics.totalRequests) * 100 : 0
      }
    };
  }

  getMetrics() {
    return {
      totalRequests: this.requestMetrics.totalRequests,
      errorCount: this.requestMetrics.errorCount,
      avgResponseTime: this.requestMetrics.avgResponseTime
    };
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  getConfig() {
    return {
      BC_ENVIRONMENT: this.cfg.BC_ENVIRONMENT,
      API_VERSION: this.cfg.BC_API_VERSION,
      CACHE_TTL_SECONDS_NUMBER: this.cfg.CACHE_TTL_SECONDS_NUMBER,
      REQUEST_TIMEOUT_MS_NUMBER: this.cfg.REQUEST_TIMEOUT_MS_NUMBER,
      RATE_LIMIT_MAX_REQUESTS_NUMBER: this.cfg.RATE_LIMIT_MAX_REQUESTS_NUMBER,
      RATE_LIMIT_WINDOW_MS_NUMBER: this.cfg.RATE_LIMIT_WINDOW_MS_NUMBER,
      METRICS_ENABLED_BOOLEAN: this.cfg.METRICS_ENABLED_BOOLEAN
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private updateMetrics(responseTime: number, isError: boolean): void {
    this.requestMetrics.totalRequests++;
    if (isError) {
      this.requestMetrics.errorCount++;
    }
    
    this.requestMetrics.requestTimes.push(responseTime);
    if (this.requestMetrics.requestTimes.length > 100) {
      this.requestMetrics.requestTimes.shift();
    }
    
    const sum = this.requestMetrics.requestTimes.reduce((a, b) => a + b, 0);
    this.requestMetrics.avgResponseTime = sum / this.requestMetrics.requestTimes.length;
  }

  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return;
    }
    await this.refreshAccessToken();
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.cfg.BC_TENANT_ID}/oauth2/v2.0/token`;
      console.log(`[BC OAuth] Requesting token from: ${tokenUrl}`);
      
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.cfg.BC_CLIENT_ID);
      params.append('client_secret', this.cfg.BC_CLIENT_SECRET);
      params.append('scope', this.cfg.OAUTH_SCOPE);

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
    return `${this.cfg.BC_BASE_URL}/${this.cfg.BC_API_VERSION}/${this.cfg.BC_TENANT_ID}/${this.cfg.BC_ENVIRONMENT}/api/${this.cfg.BC_API_VERSION}/companies(${this.cfg.BC_COMPANY_ID})`;
  }
}