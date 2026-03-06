const getEnv = (key: string, fallback: string): string => {
  const value = import.meta.env[key];
  return typeof value === "string" && value.length ? value : fallback;
};

export const config = {
  apiBaseUrl: getEnv("VITE_API_BASE_URL", "http://localhost:8000"),

  authToken: "access_token",

  requestTimeout: 30_000,
} as const;

export type Config = typeof config;
