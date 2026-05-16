export interface ChunkOptions {
  size?: number;
  maxChunks?: number;
}

export interface WeakCacheEntry {
  value: any;
  timestamp: number;
}

export interface ArrayChunk<T> {
  data: T[];
  index: number;
  isLast: boolean;
}

export interface StreamingProcessor<T, R> {
  processChunk: (chunk: T[]) => Promise<R[]>;
  onProgress?: (processed: number, total: number) => void;
}

export class WeakMapCache<K extends object, V> {
  private cache: WeakMap<K, WeakCacheEntry> = new WeakMap();
  private maxAge: number;
  private cleanupInterval: number | null = null;
  private referenceCount: Map<K, number> = new Map();

  constructor(maxAge: number = 300000) {
    this.maxAge = maxAge;
    this.startCleanup();
  }

  private startCleanup(): void {
    if (typeof window === 'undefined') return;

    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, this.maxAge);
  }

  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
    this.referenceCount.set(key, (this.referenceCount.get(key) || 0) + 1);
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.maxAge) {
      this.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: K): boolean {
    return this.cache.has(key) && this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    this.referenceCount.delete(key);
    return this.cache.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: K[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.maxAge) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.delete(key));
  }

  destroy(): void {
    if (this.cleanupInterval !== null) {
      window.clearInterval(this.cleanupInterval);
    }
    this.cache = new WeakMap();
    this.referenceCount.clear();
  }
}

export class WeakSetCache<T extends object> {
  private set: WeakSet<T> = new WeakSet();
  private timestamps: Map<T, number> = new Map();
  private maxAge: number;
  private cleanupInterval: number | null = null;

  constructor(maxAge: number = 300000) {
    this.maxAge = maxAge;
    this.startCleanup();
  }

  private startCleanup(): void {
    if (typeof window === 'undefined') return;

    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, this.maxAge);
  }

  add(value: T): void {
    this.set.add(value);
    this.timestamps.set(value, Date.now());
  }

  has(value: T): boolean {
    const timestamp = this.timestamps.get(value);
    if (!timestamp) return false;

    if (Date.now() - timestamp > this.maxAge) {
      this.delete(value);
      return false;
    }

    return this.set.has(value);
  }

  delete(value: T): boolean {
    this.timestamps.delete(value);
    return this.set.delete(value);
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: T[] = [];

    this.timestamps.forEach((timestamp, value) => {
      if (now - timestamp > this.maxAge) {
        toDelete.push(value);
      }
    });

    toDelete.forEach(value => this.delete(value));
  }

  get size(): number {
    return this.set.size;
  }

  destroy(): void {
    if (this.cleanupInterval !== null) {
      window.clearInterval(this.cleanupInterval);
    }
    this.set = new WeakSet();
    this.timestamps.clear();
  }
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }

  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export function chunkArrayBySize<T>(array: T[], maxChunkSize: number): T[][] {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }

  const chunks: T[][] = [];
  let currentChunk: T[] = [];
  let currentSize = 0;

  for (const item of array) {
    const itemSize = estimateSize(item);

    if (currentSize + itemSize > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 0;
    }

    currentChunk.push(item);
    currentSize += itemSize;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export async function processArrayInChunks<T, R>(
  array: T[],
  processor: (chunk: T[], index: number) => Promise<R>,
  chunkSize: number = 100,
  concurrency: number = 1
): Promise<R[]> {
  const chunks = chunkArray(array, chunkSize);
  const results: R[] = [];

  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((chunk, j) => processor(chunk, i + j))
    );
    results.push(...batchResults);
  }

  return results;
}

export function createChunkIterator<T>(
  array: T[],
  chunkSize: number
): Iterator<ArrayChunk<T>, void, unknown> {
  let index = 0;

  return {
    next(): IteratorResult<ArrayChunk<T>, void> {
      if (index >= array.length) {
        return { value: undefined as any, done: true };
      }

      const data = array.slice(index, index + chunkSize);
      const currentIndex = Math.floor(index / chunkSize);
      index += chunkSize;

      return {
        value: {
          data,
          index: currentIndex,
          isLast: index >= array.length,
        },
        done: false,
      };
    },
  };
}

export async function* streamProcess<T, R>(
  iterable: AsyncIterable<T[]> | T[],
  processor: StreamingProcessor<T, R>['processChunk'],
  onProgress?: (processed: number, total: number) => void
): AsyncGenerator<R[], void, unknown> {
  let processed = 0;
  let total = 0;
  const items: T[] = [];

  for await (const chunk of iterable) {
    items.push(...chunk);
    total += chunk.length;
  }

  const chunks = chunkArray(items, 100);

  for (const chunk of chunks) {
    const results = await processor(chunk);
    processed += chunk.length;
    onProgress?.(processed, total);
    yield results;
  }
}

function estimateSize(value: any): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === 'string') return value.length * 2;

  if (typeof value === 'number') return 8;

  if (typeof value === 'boolean') return 4;

  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + estimateSize(item), 0);
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 1024;
    }
  }

  return 64;
}

export function truncateLargeArray<T>(
  array: T[],
  maxLength: number,
  strategy: 'head' | 'tail' | 'sample' = 'head'
): T[] {
  if (array.length <= maxLength) {
    return array;
  }

  switch (strategy) {
    case 'head':
      return array.slice(0, maxLength);

    case 'tail':
      return array.slice(-maxLength);

    case 'sample':
      const step = Math.floor(array.length / maxLength);
      const sampled: T[] = [];
      for (let i = 0; i < maxLength && i * step < array.length; i++) {
        sampled.push(array[i * step]);
      }
      return sampled;
  }
}

export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool = [];
  }

  get size(): number {
    return this.pool.length;
  }

  drain(): T[] {
    const objects = [...this.pool];
    this.pool = [];
    return objects;
  }
}
