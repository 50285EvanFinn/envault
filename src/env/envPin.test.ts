import {
  createEmptyPinStore,
  pinKey,
  unpinKey,
  isPinned,
  listPins,
  clearPins,
  reorderPin,
} from "./envPin";

describe("envPin", () => {
  it("creates an empty pin store", () => {
    const store = createEmptyPinStore();
    expect(store.pins).toEqual([]);
  });

  it("pins a key", () => {
    const store = pinKey(createEmptyPinStore(), "API_KEY");
    expect(store.pins).toContain("API_KEY");
  });

  it("does not duplicate a pinned key", () => {
    let store = pinKey(createEmptyPinStore(), "API_KEY");
    store = pinKey(store, "API_KEY");
    expect(store.pins.filter((k) => k === "API_KEY").length).toBe(1);
  });

  it("unpins a key", () => {
    let store = pinKey(createEmptyPinStore(), "API_KEY");
    store = unpinKey(store, "API_KEY");
    expect(store.pins).not.toContain("API_KEY");
  });

  it("reports isPinned correctly", () => {
    const store = pinKey(createEmptyPinStore(), "DB_URL");
    expect(isPinned(store, "DB_URL")).toBe(true);
    expect(isPinned(store, "SECRET")).toBe(false);
  });

  it("lists all pins", () => {
    let store = createEmptyPinStore();
    store = pinKey(store, "A");
    store = pinKey(store, "B");
    expect(listPins(store)).toEqual(["A", "B"]);
  });

  it("clears all pins", () => {
    let store = pinKey(createEmptyPinStore(), "A");
    store = clearPins(store);
    expect(store.pins).toEqual([]);
  });

  it("reorders a pin to the specified index", () => {
    let store = createEmptyPinStore();
    store = pinKey(store, "A");
    store = pinKey(store, "B");
    store = pinKey(store, "C");
    store = reorderPin(store, "C", 0);
    expect(store.pins).toEqual(["C", "A", "B"]);
  });

  it("clamps reorder index to valid range", () => {
    let store = createEmptyPinStore();
    store = pinKey(store, "A");
    store = pinKey(store, "B");
    store = reorderPin(store, "A", 99);
    expect(store.pins[store.pins.length - 1]).toBe("A");
  });
});
