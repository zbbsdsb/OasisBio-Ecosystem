import type { ValidationError, ValidationResult } from './types';

export class Validator {
  static required(value: unknown, field: string): ValidationError | null {
    if (value === undefined || value === null || value === '') {
      return { field, message: `${field} is required` };
    }
    return null;
  }

  static email(value: unknown, field: string): ValidationError | null {
    if (typeof value !== 'string') {
      return { field, message: `${field} must be a valid email address` };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { field, message: `${field} must be a valid email address` };
    }
    return null;
  }

  static minLength(value: unknown, min: number, field: string): ValidationError | null {
    if (typeof value !== 'string' || value.length < min) {
      return { field, message: `${field} must be at least ${min} characters long` };
    }
    return null;
  }

  static maxLength(value: unknown, max: number, field: string): ValidationError | null {
    if (typeof value !== 'string' || value.length > max) {
      return { field, message: `${field} must not exceed ${max} characters` };
    }
    return null;
  }

  static passwordStrength(value: unknown, field: string): ValidationError | null {
    if (typeof value !== 'string') {
      return { field, message: `${field} must be at least 8 characters long` };
    }
    if (value.length < 8) {
      return { field, message: `${field} must be at least 8 characters long` };
    }
    if (!/[A-Z]/.test(value)) {
      return { field, message: `${field} must contain at least one uppercase letter` };
    }
    if (!/[a-z]/.test(value)) {
      return { field, message: `${field} must contain at least one lowercase letter` };
    }
    if (!/[0-9]/.test(value)) {
      return { field, message: `${field} must contain at least one number` };
    }
    return null;
  }

  static matches(value: unknown, otherValue: unknown, field: string, otherField: string): ValidationError | null {
    if (value !== otherValue) {
      return { field, message: `${field} must match ${otherField}` };
    }
    return null;
  }

  static username(value: unknown, field: string): ValidationError | null {
    if (typeof value !== 'string') {
      return { field, message: `${field} can only contain letters, numbers, and underscores` };
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(value)) {
      return { field, message: `${field} can only contain letters, numbers, and underscores` };
    }
    if (value.length < 3 || value.length > 20) {
      return { field, message: `${field} must be between 3 and 20 characters long` };
    }
    return null;
  }

  static url(value: unknown, field: string): ValidationError | null {
    if (typeof value !== 'string') {
      return { field, message: `${field} must be a valid URL` };
    }
    try {
      new URL(value);
      return null;
    } catch {
      return { field, message: `${field} must be a valid URL` };
    }
  }

  static validate(
    data: Record<string, unknown>,
    rules: { [key: string]: ((value: unknown, field: string) => ValidationError | null)[] }
  ): ValidationResult {
    const errors: ValidationError[] = [];

    Object.entries(rules).forEach(([field, fieldRules]) => {
      const value = data[field];
      fieldRules.forEach(rule => {
        const error = rule(value, field);
        if (error) {
          errors.push(error);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const validateRegisterForm = (data: { name: string; email: string; password: string }): ValidationResult => {
  return Validator.validate(data, {
    name: [
      (value) => Validator.required(value, 'Name'),
      (value) => Validator.minLength(value, 2, 'Name'),
      (value) => Validator.maxLength(value, 50, 'Name')
    ],
    email: [
      (value) => Validator.required(value, 'Email'),
      (value) => Validator.email(value, 'Email')
    ],
    password: [
      (value) => Validator.required(value, 'Password'),
      (value) => Validator.passwordStrength(value, 'Password')
    ]
  });
};

export const validateSettingsForm = (data: Record<string, unknown>, section: string): ValidationResult => {
  if (section === 'account' || section === 'profile') {
    return Validator.validate(data, {
      username: [
        (value) => Validator.required(value, 'Username'),
        (value) => Validator.username(value, 'Username')
      ],
      displayName: [
        (value) => Validator.required(value, 'Display Name'),
        (value) => Validator.minLength(value, 2, 'Display Name'),
        (value) => Validator.maxLength(value, 50, 'Display Name')
      ],
      website: [
        (value) => value ? Validator.url(value, 'Website') : null
      ],
      avatarUrl: [
        (value) => value ? Validator.url(value, 'Avatar URL') : null
      ]
    });
  } else if (section === 'security') {
    return Validator.validate(data, {
      currentPassword: [
        (value) => Validator.required(value, 'Current Password')
      ],
      newPassword: [
        (value) => Validator.required(value, 'New Password'),
        (value) => Validator.passwordStrength(value, 'New Password')
      ],
      confirmPassword: [
        (value) => Validator.required(value, 'Confirm Password'),
        (value, field) => Validator.matches(value, data.newPassword, field, 'New Password')
      ]
    });
  }
  return { isValid: true, errors: [] };
};
