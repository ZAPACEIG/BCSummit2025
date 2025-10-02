export interface MCPServerConfig {
  businessCentral: {
    baseUrl: string;
    tenantId: string;
    environment: string;
    companyId: string;
    apiVersion: string;
  };
  auth: {
    clientId: string;
    clientSecret: string;
    scope: string;
  };
}