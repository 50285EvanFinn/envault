import {
  createEmptyValidationStore,
  setValidationRule,
  removeValidationRule,
  getValidationRule,
  validateValue,
  listValidationRules,
} from "./envValidation";

describe("envValidation", () => {
  describe("createEmptyValidationStore", () => {
    it("returns a store with no rules", () => {
      const store = createEmptyValidationStore();
      expect(store.rules).toEqual({});
    });
  });

  describe("setValidationRule", () => {
    it("adds a rule for a key", () => {
      const store = createEmptyValidationStore();
      const updated = setValidationRule(store, "API_KEY", { minLength: 8 });
      expect(updated.rules["API_KEY"]).toEqual({ minLength: 8 });
    });

    it("overwrites an existing rule", () => {
      let store = createEmptyValidationStore();
      store = setValidationRule(store, "API_KEY", { minLength: 8 });
      store = setValidationRule(store, "API_KEY", { maxLength: 32 });
      expect(store.rules["API_KEY"]).toEqual({ maxLength: 32 });
    });

    it("does not mutate the original store", () => {
      const store = createEmptyValidationStore();
      setValidationRule(store, "KEY", { required: true });
      expect(store.rules["KEY"]).toBeUndefined();
    });
  });

  describe("removeValidationRule", () => {
    it("removes a rule for a key", () => {
      let store = createEmptyValidationStore();
      store = setValidationRule(store, "PORT", { pattern: "^\\d+$" });
      store = removeValidationRule(store, "PORT");
      expect(store.rules["PORT"]).toBeUndefined();
    });

    it("is a no-op for non-existent keys", () => {
      const store = createEmptyValidationStore();
      const updated = removeValidationRule(store, "MISSING");
      expect(updated.rules).toEqual({});
    });
  });

  describe("getValidationRule", () => {
    it("returns the rule for a known key", () => {
      let store = createEmptyValidationStore();
      store = setValidationRule(store, "SECRET", { required: true, minLength: 16 });
      expect(getValidationRule(store, "SECRET")).toEqual({ required: true, minLength: 16 });
    });

    it("returns undefined for unknown keys", () => {
      const store = createEmptyValidationStore();
      expect(getValidationRule(store, "UNKNOWN")).toBeUndefined();
    });
  });

  describe("validateValue", () => {
    it("passes when all constraints are satisfied", () => {
      const result = validateValue({ minLength: 3, maxLength: 10, pattern: "^[a-z]+$" }, "hello");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("fails required check on empty value", () => {
      const result = validateValue({ required: true }, "");
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/required/);
    });

    it("fails minLength check", () => {
      const result = validateValue({ minLength: 10 }, "short");
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/at least 10/);
    });

    it("fails maxLength check", () => {
      const result = validateValue({ maxLength: 4 }, "toolongvalue");
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/no more than 4/);
    });

    it("fails pattern check", () => {
      const result = validateValue({ pattern: "^\\d+$" }, "abc");
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/pattern/);
    });

    it("accumulates multiple errors", () => {
      const result = validateValue({ minLength: 10, pattern: "^\\d+$" }, "ab");
      expect(result.errors).toHaveLength(2);
    });
  });

  describe("listValidationRules", () => {
    it("returns all rules as key-rule pairs", () => {
      let store = createEmptyValidationStore();
      store = setValidationRule(store, "A", { required: true });
      store = setValidationRule(store, "B", { maxLength: 5 });
      const list = listValidationRules(store);
      expect(list).toHaveLength(2);
      expect(list.map((r) => r.key)).toContain("A");
      expect(list.map((r) => r.key)).toContain("B");
    });
  });
});
