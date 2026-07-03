import type { ApiSource } from "@/types";

export interface RetailerAdapter {
  source: ApiSource;
  /** The API / affiliate network this adapter integrates with. */
  label: string;
  /** Env vars that must be set before this adapter can run in production. */
  requiredEnvVars: string[];
  isConfigured(): boolean;
}
