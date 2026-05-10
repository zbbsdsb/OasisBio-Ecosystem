import { VALIDATION_RULES } from '@oasisbio/common-core';
import {
  validateRequired,
  validateEmail as validateEmailFormat,
  validateLength,
  createValidationResult,
  addValidationError,
  type ValidationResult
} from '@oasisbio/common-utils';
import type { LoginWithOtpRequest, VerifyOtpRequest } from '@oasisbio/common-core';

export function validateLoginWithOtp(request: LoginWithOtpRequest): ValidationResult {
  const result = createValidationResult();

  if (!validateRequired(request.email)) {
    addValidationError(result, 'email', 'Email is required');
  } else if (!validateEmailFormat(request.email)) {
    addValidationError(result, 'email', 'Invalid email format');
  }

  return result;
}

export function validateVerifyOtp(request: VerifyOtpRequest): ValidationResult {
  const result = createValidationResult();

  if (!validateRequired(request.email)) {
    addValidationError(result, 'email', 'Email is required');
  } else if (!validateEmailFormat(request.email)) {
    addValidationError(result, 'email', 'Invalid email format');
  }

  if (!validateRequired(request.token)) {
    addValidationError(result, 'token', 'Token is required');
  } else if (!validateLength(request.token, VALIDATION_RULES.OTP_CODE.MIN_LENGTH, VALIDATION_RULES.OTP_CODE.MAX_LENGTH)) {
    addValidationError(result, 'token', `Token must be ${VALIDATION_RULES.OTP_CODE.MIN_LENGTH} characters`);
  }

  return result;
}
