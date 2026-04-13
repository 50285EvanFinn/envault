import {
  addTag,
  removeTag,
  getTagsForKey,
  findKeysByTag,
  listAllTags,
  removeKeyFromTags,
  TagMap,
} from "./envTags";

describe("envTags", () => {
  const baseTags: TagMap = {
    DATABASE_URL: ["db", "production"],
    API_KEY: ["api", "production"],
    DEBUG: ["dev"],
  };

  describe("addTag", () => {
    it("adds a new tag to a key", () => {
      const result = addTag(baseTags, "DEBUG", "staging");
      expect(result["DEBUG"]).toContain("staging");
    });

    it("does not duplicate an existing tag", () => {
      const result = addTag(baseTags, "DEBUG", "dev");
      expect(result["DEBUG"].filter((t) => t === "dev").length).toBe(1);
    });

    it("creates entry for new key", () => {
      const result = addTag(baseTags, "NEW_KEY", "fresh");
      expect(result["NEW_KEY"]).toEqual(["fresh"]);
    });
  });

  describe("removeTag", () => {
    it("removes an existing tag", () => {
      const result = removeTag(baseTags, "DATABASE_URL", "db");
      expect(result["DATABASE_URL"]).not.toContain("db");
    });

    it("removes key entirely when no tags remain", () => {
      const result = removeTag(baseTags, "DEBUG", "dev");
      expect(result["DEBUG"]).toBeUndefined();
    });

    it("is a no-op for non-existent tag", () => {
      const result = removeTag(baseTags, "API_KEY", "nonexistent");
      expect(result["API_KEY"]).toEqual(["api", "production"]);
    });
  });

  describe("getTagsForKey", () => {
    it("returns tags for an existing key", () => {
      expect(getTagsForKey(baseTags, "API_KEY")).toEqual(["api", "production"]);
    });

    it("returns empty array for unknown key", () => {
      expect(getTagsForKey(baseTags, "MISSING")).toEqual([]);
    });
  });

  describe("findKeysByTag", () => {
    it("finds all keys with a given tag", () => {
      const keys = findKeysByTag(baseTags, "production");
      expect(keys).toContain("DATABASE_URL");
      expect(keys).toContain("API_KEY");
      expect(keys).not.toContain("DEBUG");
    });

    it("returns empty array when no keys match", () => {
      expect(findKeysByTag(baseTags, "unknown")).toEqual([]);
    });
  });

  describe("listAllTags", () => {
    it("returns sorted unique tags", () => {
      const tags = listAllTags(baseTags);
      expect(tags).toEqual(["api", "db", "dev", "production"]);
    });
  });

  describe("removeKeyFromTags", () => {
    it("removes all tags for a key", () => {
      const result = removeKeyFromTags(baseTags, "API_KEY");
      expect(result["API_KEY"]).toBeUndefined();
      expect(result["DATABASE_URL"]).toBeDefined();
    });
  });
});
