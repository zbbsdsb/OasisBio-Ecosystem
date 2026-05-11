import { VALIDATION_RULES } from '@oasisbio/common-core';
import {
  validateRequired,
  createValidationResult,
  addValidationError,
  type ValidationResult
} from '@oasisbio/common-utils';

export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
}

export function validateFile(
  file: { size: number; type: string; name?: string },
  options: FileValidationOptions = {}
): ValidationResult {
  const result = createValidationResult();
  const { maxSize = VALIDATION_RULES.FILE_SIZE.MODEL, allowedTypes } = options;

  if (!validateRequired(file)) {
    addValidationError(result, 'file', 'File is required');
    return result;
  }

  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    addValidationError(result, 'file', `File size must be less than ${sizeMB}MB`);
  }

  if (allowedTypes && allowedTypes.length > 0) {
    const fileExt = file.name?.split('.').pop()?.toLowerCase() || '';
    const mimeTypeMatch = allowedTypes.some(type => file.type.includes(type));
    const extMatch = allowedTypes.some(type => fileExt.includes(type));
    if (!mimeTypeMatch && !extMatch) {
      addValidationError(result, 'file', `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }

  return result;
}

export function validateImageFile(file: { size: number; type: string; name?: string }): ValidationResult {
  return validateFile(file, {
    maxSize: VALIDATION_RULES.FILE_SIZE.CHARACTER_COVER,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'jpg', 'png', 'webp']
  });
}

export function validateDcosFile(file: { size: number; type: string; name?: string }): ValidationResult {
  return validateFile(file, {
    maxSize: VALIDATION_RULES.FILE_SIZE.EXPORT,
    allowedTypes: [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'pdf',
      'txt',
      'doc',
      'docx'
    ]
  });
}
