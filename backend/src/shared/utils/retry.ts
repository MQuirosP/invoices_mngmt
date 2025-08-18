export const retry = async <T>(
  fn: () => Promise<T>,
  options?: {
    attempts?: number;
    delayMs?: number;
    onRetry?: (error: unknown, attempt: number) => void;
  }
): Promise<T> => {
  const attempts = options?.attempts ?? 3;
  const delayMs = options?.delayMs ?? 500;

  let lastError: unknown;

  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      options?.onRetry?.(error, i);

      if (i < attempts) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }

  throw lastError;
};