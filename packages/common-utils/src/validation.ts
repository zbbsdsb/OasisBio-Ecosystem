import { VALIDATION_RULES } from '@oasisbio/common-core';

export function validateRequired(value: any): boolean {
  return value !== null && value !== undefined && value !== '';
}

export function validateLength(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max;
}

export function validateRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function validateSlug(slug: string): boolean {
  return VALIDATION_RULES.SLUG.PATTERN.test(slug) &&
         validateLength(slug, VALIDATION_RULES.SLUG.MIN_LENGTH, VALIDATION_RULES.SLUG.MAX_LENGTH);
}

export function validateUsername(username: string): boolean {
  return VALIDATION_RULES.USERNAME.PATTERN.test(username) &&
         validateLength(username, VALIDATION_RULES.USERNAME.MIN_LENGTH, VALIDATION_RULES.USERNAME.MAX_LENGTH);
}

export function validateDisplayName(displayName: string): boolean {
  return validateLength(displayName, VALIDATION_RULES.DISPLAY_NAME.MIN_LENGTH, VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH);
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function createValidationResult(): ValidationResult {
  return { valid: true, errors: [] };
}

export function addValidationError(result: ValidationResult, field: string, message: string): ValidationResult {
  result.valid = false;
  result.errors.push({ field, message });
  return result;
}
