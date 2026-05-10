import { VALIDATION_RULES } from '@oasisbio/common-core';
import {
  validateRequired,
  validateLength,
  validateSlug as validateSlugFormat,
  createValidationResult,
  addValidationError,
  type ValidationResult
