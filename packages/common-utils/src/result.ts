import type { Result as CoreResult } from '@oasisbio/common-core';

export { ok, err } from '@oasisbio/common-core';
export type { Result } from '@oasisbio/common-core';

export function tryCatch<T, E = Error>(fn: () => T): CoreResult<T, E> {
  try {
    return { ok: true, value: fn() };
  } catch (error) {
    return { ok: false, error: error as E };
  }
}

export async function tryCatchAsync<T, E = Error>(fn: () => Promise<T>): Promise<CoreResult<T, E>> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    return { ok: false, error: error as E };
  }
}
