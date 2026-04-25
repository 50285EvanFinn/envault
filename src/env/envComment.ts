export interface CommentStore {
  comments: Record<string, string>;
}

export function createEmptyCommentStore(): CommentStore {
  return { comments: {} };
}

export function setComment(
  store: CommentStore,
  key: string,
  comment: string
): CommentStore {
  return {
    ...store,
    comments: { ...store.comments, [key]: comment },
  };
}

export function removeComment(
  store: CommentStore,
  key: string
): CommentStore {
  const comments = { ...store.comments };
  delete comments[key];
  return { ...store, comments };
}

export function getComment(
  store: CommentStore,
  key: string
): string | undefined {
  return store.comments[key];
}

export function hasComment(store: CommentStore, key: string): boolean {
  return key in store.comments;
}

export function listCommentedKeys(store: CommentStore): string[] {
  return Object.keys(store.comments);
}
