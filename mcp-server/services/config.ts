import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Configuration schema for BC Summit 2025 MCP Server
 * Validates all required environment variables with proper defaults
 */
const ConfigSchema = z.object({
  // OAuth Authentication
  BC_CLIENT_ID: z.string().min(1, "BC_CLIENT_ID is required"),
  BC_CLIENT_SECRET: z.string().min(1, "BC_CLIENT_SECRET is required"),
  BC_TENANT_ID: z.string().min(1, "BC_TENANT_ID is required"),
  OAUTH_SCOPE: z.string().default("https://api.businesscentral.dynamics.com/.default"),

  // Business Central Configuration
  BC_BASE_URL: z.string().url("BC_BASE_URL must be a valid URL").default("https://api.businesscentral.dynamics.com"),
  BC_ENVIRONMENT: z.string().min(1, "BC_ENVIRONMENT is required"),
  BC_COMPANY_ID: z.string().min(1, "BC_COMPANY_ID is required"),
  BC_API_VERSION: z.string().default("v2.0"),

  // Server Configuration
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),

  // Performance & Timeouts (matching Test server)
  REQUEST_TIMEOUT_MS: z.string().default("30000"),
  CACHE_TTL_SECONDS: z.string().default("300"),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default("60000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100"),

  // Monitoring
  METRICS_ENABLED: z.string().default("true"),
  HEALTH_CHECK_INTERVAL_MS: z.string().default("30000"),
});

export type Config = z.infer<typeof ConfigSchema>;

export interface TransformedConfig extends Config {
  PORT_NUMBER: number;
  REQUEST_TIMEOUT_MS_NUMBER: number;
  CACHE_TTL_SECONDS_NUMBER: number;
  RATE_LIMIT_WINDOW_MS_NUMBER: number;
  RATE_LIMIT_MAX_REQUESTS_NUMBER: number;
  HEALTH_CHECK_INTERVAL_MS_NUMBER: number;
  METRICS_ENABLED_BOOLEAN: boolean;
}

/**
 * Parse and validate configuration from environment variables
 */
export function getConfig(): TransformedConfig {
  try {
    const rawConfig = ConfigSchema.parse({
      BC_CLIENT_ID: process.env['BC_CLIENT_ID'],
      BC_CLIENT_SECRET: process.env['BC_CLIENT_SECRET'],
      BC_TENANT_ID: process.env['BC_TENANT_ID'],
      OAUTH_SCOPE: process.env['OAUTH_SCOPE'],
      BC_BASE_URL: process.env['BC_BASE_URL'],
      BC_ENVIRONMENT: process.env['BC_ENVIRONMENT'],
      BC_COMPANY_ID: process.env['BC_COMPANY_ID'],
      BC_API_VERSION: process.env['BC_API_VERSION'],
      PORT: process.env['PORT'],
      NODE_ENV: process.env['NODE_ENV'],
      REQUEST_TIMEOUT_MS: process.env['REQUEST_TIMEOUT_MS'],
      CACHE_TTL_SECONDS: process.env['CACHE_TTL_SECONDS'],
      RATE_LIMIT_WINDOW_MS: process.env['RATE_LIMIT_WINDOW_MS'],
      RATE_LIMIT_MAX_REQUESTS: process.env['RATE_LIMIT_MAX_REQUESTS'],
      METRICS_ENABLED: process.env['METRICS_ENABLED'],
      HEALTH_CHECK_INTERVAL_MS: process.env['HEALTH_CHECK_INTERVAL_MS'],
    });

    const transformed: TransformedConfig = {
      ...rawConfig,
      PORT_NUMBER: parseInt(rawConfig.PORT, 10),
      REQUEST_TIMEOUT_MS_NUMBER: parseInt(rawConfig.REQUEST_TIMEOUT_MS, 10),
      CACHE_TTL_SECONDS_NUMBER: parseInt(rawConfig.CACHE_TTL_SECONDS, 10),
      RATE_LIMIT_WINDOW_MS_NUMBER: parseInt(rawConfig.RATE_LIMIT_WINDOW_MS, 10),
      RATE_LIMIT_MAX_REQUESTS_NUMBER: parseInt(rawConfig.RATE_LIMIT_MAX_REQUESTS, 10),
      HEALTH_CHECK_INTERVAL_MS_NUMBER: parseInt(rawConfig.HEALTH_CHECK_INTERVAL_MS, 10),
      METRICS_ENABLED_BOOLEAN: rawConfig.METRICS_ENABLED.toLowerCase() === "true",
    };

    console.log("✅ Configuration loaded successfully:", {
      BC_CLIENT_ID: rawConfig.BC_CLIENT_ID ? "***" : "missing",
      BC_CLIENT_SECRET: rawConfig.BC_CLIENT_SECRET ? "***" : "missing",
      BC_TENANT_ID: rawConfig.BC_TENANT_ID ? "***" : "missing",
      BC_BASE_URL: rawConfig.BC_BASE_URL,
      BC_ENVIRONMENT: rawConfig.BC_ENVIRONMENT,
      BC_COMPANY_ID: rawConfig.BC_COMPANY_ID ? "***" : "missing",
      BC_API_VERSION: rawConfig.BC_API_VERSION,
      REQUEST_TIMEOUT: `${transformed.REQUEST_TIMEOUT_MS_NUMBER}ms`,
      CACHE_TTL: `${transformed.CACHE_TTL_SECONDS_NUMBER}s`,
      METRICS_ENABLED: transformed.METRICS_ENABLED_BOOLEAN,
    });

    return transformed;
  } catch (error) {
    console.error("❌ Configuration validation failed:");
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    } else {
      console.error(error);
    }
    
    console.error("\n📋 Required environment variables:");
    console.error("  - BC_CLIENT_ID: OAuth client ID");
    console.error("  - BC_CLIENT_SECRET: OAuth client secret");
    console.error("  - BC_TENANT_ID: Azure AD tenant ID");
    console.error("  - BC_ENVIRONMENT: BC environment name");
    console.error("  - BC_COMPANY_ID: BC company GUID");
    
    throw new Error("Invalid configuration - check environment variables");
  }
}

// Singleton instance
let configInstance: TransformedConfig | null = null;

export function config(): TransformedConfig {
  if (!configInstance) {
    configInstance = getConfig();
  }
  return configInstance;
}
