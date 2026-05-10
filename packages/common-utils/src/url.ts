import { VALIDATION_RULES } from '@oasisbio/common-core';

export function buildUrl(baseUrl: string, path: string, params: Record<string, string | number> = {}): string {
  const url = new