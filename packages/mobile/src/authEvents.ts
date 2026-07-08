type Listener = () => void;

const listeners = new Set<Listener>();

/** Called by apiClient whenever a request gets a 401 — fires regardless of which screen triggered it. */
export function notifyUnauthorized(): void {
  for (const listener of listeners) listener();
}

export function onUnauthorized(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
