/**
 * Manage exactly one in-browser model instance.
 * A successful initial load does not imply the engine will remain available:
 * GPU devices can be lost and WebLLM can unload after an exception.
 *
 * Serializing load/invalidate operations prevents two model selections from
 * leaving separate engines in GPU memory.
 */
export function createLocalModelSession<T extends { unload(): Promise<void> }>(
  create: (modelId: string, onProgress: (message: string) => void) => Promise<T>,
) {
  let active: { modelId: string; engine: T } | null = null;
  let queue: Promise<void> = Promise.resolve();

  function sequential<R>(fn: () => Promise<R>): Promise<R> {
    const operation = queue.then(fn, fn);
    queue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  async function unloadActive() {
    const previous = active;
    active = null;
    if (previous) {
      try {
        await previous.engine.unload();
      } catch {
        // A lost GPU device may already have made unload impossible.
        // The previous instance must still be considered unusable.
      }
    }
  }

  function load(modelId: string, onProgress: (message: string) => void) {
    return sequential(async () => {
      if (active?.modelId === modelId) return active.engine;
      await unloadActive();
      // Assign active only after the factory has completed, including the
      // initial generation smoke test.
      const engine = await create(modelId, onProgress);
      active = { modelId, engine };
      return engine;
    });
  }

  function invalidate(modelId?: string) {
    return sequential(async () => {
      if (!modelId || active?.modelId === modelId) await unloadActive();
    });
  }

  return { load, invalidate };
}
