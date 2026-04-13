export interface TagMap {
  [key: string]: string[];
}

export interface VaultPayloadWithTags {
  tags?: TagMap;
}

export function addTag(tags: TagMap, key: string, tag: string): TagMap {
  const existing = tags[key] ?? [];
  if (existing.includes(tag)) return tags;
  return { ...tags, [key]: [...existing, tag] };
}

export function removeTag(tags: TagMap, key: string, tag: string): TagMap {
  const existing = tags[key] ?? [];
  const updated = existing.filter((t) => t !== tag);
  if (updated.length === 0) {
    const { [key]: _, ...rest } = tags;
    return rest;
  }
  return { ...tags, [key]: updated };
}

export function getTagsForKey(tags: TagMap, key: string): string[] {
  return tags[key] ?? [];
}

export function findKeysByTag(tags: TagMap, tag: string): string[] {
  return Object.entries(tags)
    .filter(([, keyTags]) => keyTags.includes(tag))
    .map(([key]) => key);
}

export function listAllTags(tags: TagMap): string[] {
  const all = new Set<string>();
  for (const keyTags of Object.values(tags)) {
    for (const tag of keyTags) {
      all.add(tag);
    }
  }
  return Array.from(all).sort();
}

export function removeKeyFromTags(tags: TagMap, key: string): TagMap {
  const { [key]: _, ...rest } = tags;
  return rest;
}
