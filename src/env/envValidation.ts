/**
 * envValidation.ts
 * Provides validation rules and enforcement for environment variable values.
 */

export type ValidationRule = {
  pattern?: string;   // regex pattern string
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  description?: string;
};

export type ValidationStore = {
  rules: Record<string, ValidationRule>;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function createEmptyValidationStore(): ValidationStore {
  return { rules: {} };
}

export function setValidationRule(
  store: ValidationStore,
  key: string,
  rule: ValidationRule
): ValidationStore {
  return {
    ...store,
    rules: { ...store.rules, [key]: rule },
  };
}

export function removeValidationRule(
  store: ValidationStore,
  key: string
): ValidationStore {
  const rules = { ...store.rules };
  delete rules[key];
  return { ...store, rules };
}

export function getValidationRule(
  store: ValidationStore,
  key: string
): ValidationRule | undefined {
  return store.rules[key];
}

export function validateValue(
  rule: ValidationRule,
  value: string
): ValidationResult {
  const errors: string[] = [];

  if (rule.required && value.trim() === "") {
    errors.push("Value is required and cannot be empty.");
  }

  if (rule.minLength !== undefined && value.length < rule.minLength) {
    errors.push(`Value must be at least ${rule.minLength} characters long.`);
  }

  if (rule.maxLength !== undefined && value.length > rule.maxLength) {
    errors.push(`Value must be no more than ${rule.maxLength} characters long.`);
  }

  if (rule.pattern !== undefined) {
    const regex = new RegExp(rule.pattern);
    if (!regex.test(value)) {
      errors.push(`Value does not match required pattern: ${rule.pattern}.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function listValidationRules(
  store: ValidationStore
): Array<{ key: string; rule: ValidationRule }> {
  return Object.entries(store.rules).map(([key, rule]) => ({ key, rule }));
}
