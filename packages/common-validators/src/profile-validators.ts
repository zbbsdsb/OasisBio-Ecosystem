import { VALIDATION_RULES } from '@oasisbio/common-core';
import {
  validateRequired,
  validateLength,
  validateUsername as validateUsernameFormat,
  validateEmail as validateEmailFormat,
  createValidationResult,
  addValidationError,
  type ValidationResult
} from '@oasisbio/common-utils';
import type { UpdateProfileRequest, RegisterRequest } from '@oasisbio/common-core';

export function validateUpdateProfile(request: UpdateProfileRequest): ValidationResult {
  const result = createValidationResult();

  if (request.username !== undefined && !validateUsernameFormat(request.username)) {
    addValidationError(result, 'username', 'Username must be lowercase alphanumeric with underscores, 3-20 characters');
  }

  if (request.displayName !== undefined && !validateLength(request.displayName, VALIDATION_RULES.DISPLAY_NAME.MIN_LENGTH, VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH)) {
    addValidationError(result, 'displayName', `Display name must be between ${VALIDATION_RULES.DISPLAY_NAME.MIN_LENGTH} and ${VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH} characters`);
  }

  if (request.bio !== undefined && request.bio.length > VALIDATION_RULES.BIO.MAX_LENGTH) {
    addValidationError(result, 'bio', `Bio must be less than ${VALIDATION_RULES.BIO.MAX_LENGTH} characters`);
  }

  return result;
}

export function validateRegister(request: RegisterRequest): ValidationResult {
  const result = createValidationResult();

  if (!validateRequired(request.email)) {
    addValidationError(result, 'email', 'Email is required');
  } else if (!validateEmailFormat(request.email)) {
    addValidationError(result, 'email', 'Invalid email format');
  }

  if (!validateRequired(request.username)) {
    addValidationError(result, 'username', 'Username is required');
  } else if (!validateUsernameFormat(request.username)) {
    addValidationError(result, 'username', 'Username must be lowercase alphanumeric with underscores, 3-20 characters');
  }

  if (!validateRequired(request.displayName)) {
    addValidationError(result, 'displayName', 'Display name is required');
  } else if (!validateLength(request.displayName, VALIDATION_RULES.DISPLAY_NAME.MIN_LENGTH, VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH)) {
    addValidationError(result, 'displayName', `Display name must be between ${VALIDATION_RULES.DISPLAY_NAME.MIN_LENGTH} and ${VALIDATION_RULES.DISPLAY_NAME.MAX_LENGTH} characters`);
  }

  return result;
}
