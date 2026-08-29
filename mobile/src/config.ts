import type { ReportClientConfig } from "./api/reportClient";

/**
 * Runtime configuration. In a real build these come from EAS secrets / env; here
 * we read Expo public env vars with safe local defaults so the app runs against a
 * locally running service.
 */
const env: Record<string, string | undefined> =
  typeof process !== "undefined" && process.env ? process.env : {};

export const API_BASE_URL: string =
  env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export const API_TOKEN: string =
  env.EXPO_PUBLIC_API_TOKEN ?? "dev-mobile-token";

export function clientConfig(deviceId: string): ReportClientConfig {
  return { baseUrl: API_BASE_URL, token: API_TOKEN, deviceId };
}
