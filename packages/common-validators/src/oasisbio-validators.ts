import { VALIDATION_RULES } from '@oasisbio/common-core';
import {
  validateRequired,
  validateLength,
  validateSlug as validateSlugFormat,
  createValidationResult,
  addValidationError,
  type ValidationResult
} from '@oasisbio/common-utils';
import type { CreateOasisBioRequest, UpdateOasisBioRequest } from '@oasisbio/common-core';

export function validateCreateOasisBio(request: CreateOasisBioRequest): ValidationResult {
  const result = createValidationResult();

  if (!validateRequired(request.title)) {
    addValidationError(result, 'title', 'Title is required');
  } else if (!validateLength(request.title, VALIDATION_RULES.OASISBIO_TITLE.MIN_LENGTH, VALIDATION_RULES.OASISBIO_TITLE.MAX_LENGTH)) {
    addValidationError(result, 'title', `Title must be between ${VALIDATION_RULES.OASISBIO_TITLE.MIN_LENGTH} and ${VALIDATION_RULES.OASISBIO_TITLE.MAX_LENGTH} characters`);
  }

  if (!validateRequired(request.identityMode)) {
    addValidationError(result, 'identityMode', 'Identity mode is required');
  }

  return result;
}

export function validateUpdateOasisBio(request: UpdateOasisBioRequest): ValidationResult {
  const result = createValidationResult();

  if (request.title !== undefined && !validateLength(request.title, VALIDATION_RULES.OASISBIO_TITLE.MIN_LENGTH, VALIDATION_RULES.OASISBIO_TITLE.MAX_LENGTH)) {
    addValidationError(result, 'title', `Title must be between ${VALIDATION_RULES.OASISBIO_TITLE.MIN_LENGTH} and ${VALIDATION_RULES.OASISBIO_TITLE.MAX_LENGTH} characters`);
  }

  return result;
}

export function validateAbilityName(name: string): ValidationResult {
  const result = createValidationResult();
  if (!validateRequired(name)) {
    addValidationError(result, 'name', 'Ability name is required');
  } else if (!validateLength(name, VALIDATION_RULES.ABILITY_NAME.MIN_LENGTH, VALIDATION_RULES.ABILITY_NAME.MAX_LENGTH)) {
    addValidationError(result, 'name', `Ability name must be between ${VALIDATION_RULES.ABILITY_NAME.MIN_LENGTH} and ${VALIDATION_RULES.ABILITY_NAME.MAX_LENGTH} characters`);
  }
  return result;
}
