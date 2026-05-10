import { VALIDATION_RULES } from '@oasisbio/common-core';

export function buildUrl(baseUrl: string, path: string, params: Record<string, string | number> = {}): string {
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
}

export function extractQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlObj = new URL(url);
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return VALIDATION_RULES.REFERENCE_URL.PATTERN.test(url);
  } catch {
    return false;
  }
}

export function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
