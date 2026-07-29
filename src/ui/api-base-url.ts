export const DEFAULT_EVM_API_BASE_URL = "/mock-api";

export function resolveEvmApiBaseUrl(
  configuredBaseUrl = process.env.NEXT_PUBLIC_EVM_API_BASE_URL,
): string {
  const trimmed = configuredBaseUrl?.trim();

  if (!trimmed) {
    return DEFAULT_EVM_API_BASE_URL;
  }

  if (trimmed === "/") {
    return "";
  }

  return trimmed.replace(/\/+$/, "");
}

export function buildEvmApiUrl(
  pathname: `/${string}`,
  configuredBaseUrl = process.env.NEXT_PUBLIC_EVM_API_BASE_URL,
): string {
  return `${resolveEvmApiBaseUrl(configuredBaseUrl)}${pathname}`;
}
