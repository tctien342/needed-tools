import { CACHE_TIME_TEMPLATE, DEFAULT_CACHE_TIME } from '@constants/cache';

import { Logger } from './log';
import { StorageManager } from './storage';

interface ICachedData<T = unknown> {
  /**
   * Cached data
   */
  data: T;
  /**
   * Tag for this cache
   */
  tags?: string[];
  /**
   * Time to live of data
   */
  ttl: number;
}

/**
 * Caching using indexDB for better data cache on client
 */
class CacheManager {
  /**
   * Get template cache time
   */
  static TIME = CACHE_TIME_TEMPLATE;

  activated: boolean;
  debug: Logger;
  ramCache: StorageManager<ICachedData>;
  storeCache: StorageManager<ICachedData>;
  storeName: string;

  constructor(storeName: string, activated = true, log = true) {
    this.activated = activated;
    this.storeName = storeName;
    this.debug = new Logger(`CACHE_${storeName}`, log);
    this.ramCache = new StorageManager<ICachedData>(`RAM_${storeName}`, { log, ramCache: true });
    this.storeCache = new StorageManager<ICachedData>(`STORE_${storeName}`, { log });
  }

  /**
   * Clean current cache
   */
  public async clean(opts?: { tag?: string; tags?: string[] }): Promise<void> {
    if (!this.ramCache.isAvailable || !this.activated) return;

    this.debug.i('clean', 'Triggered with option', opts);

    /**
     * Clear IDB Cache
     */
    const storageData: [string, ICachedData][] = await this.storeCache.entries();
    const ramData: [string, ICachedData][] = await this.ramCache.entries();
    const currentTime = Date.now();

    const cleanJob = [...storageData, ...ramData].map(async (cacheItem, idx) => {
      const store = idx < storageData.length ? this.storeCache : this.ramCache;
      if (cacheItem[1].ttl < currentTime) {
        await store.remove(cacheItem[0].toString());
        return;
      }
      if (cacheItem[1].tags) {
        if (opts?.tag) {
          if (cacheItem[1].tags.includes(opts.tag)) {
            await store.remove(cacheItem[0].toString());
            return;
          }
        }
        if (opts?.tags) {
          if (cacheItem[1].tags.some((tag) => opts.tags?.includes(tag))) {
            await store.remove(cacheItem[0].toString());
          }
        }
      }
    });
    await Promise.all(cleanJob);
  }

  /**
   * Remove all cache
   */
  public clear(): void {
    if (!this.ramCache.isAvailable || !this.activated) return;

    this.debug.i('clear', 'Triggered');
    /**
     * Clear IDB Cache
     */
    this.storeCache.clear();
    /**
     * Clear LRUCache
     */
    this.ramCache.clear();
  }

  /**
   * Clean cache by a tag
   */
  public async clearByTag(tag: string): Promise<void> {
    await this.clean({ tag });
  }

  /**
   * Clean cache by multi tags
   */
  public async clearByTags(tags: string[]): Promise<void> {
    await this.clean({ tags });
  }

  /**
   * Set an cache
   */
  public async get<T = unknown>({
    generator,
    key,
    onStorage = true,
    tags = [],
    tl = DEFAULT_CACHE_TIME,
  }: {
    /**
     * Data generator function, API call or something
     */
    generator?: () => Promise<T>;
    /**
     * Cache key
     */
    key: string;
    /**
     * Will store on storage if set to true
     */
    onStorage?: boolean;
    /**
     * Cache tags, depends tag for this cache
     */
    tags?: string[];
    /**
     * Time to live of this cache
     */
    tl?: keyof typeof CACHE_TIME_TEMPLATE | number;
  }): Promise<T | null> {
    if (!this.ramCache.isAvailable || !this.activated) return generator?.() || null;

    /**
     * Checking if cache is available
     */
    let isRam = false;
    let currentData = await this.storeCache.get(key);
    if (!currentData) {
      isRam = true;
      currentData = await this.ramCache.get(key);
    }

    const currentTime = Date.now();

    if (currentData && currentTime <= currentData.ttl) {
      this.debug.i('get', 'Getting cache data', { isRam, key, tags, tl });
      return currentData.data as T;
    }

    if (!generator) return null;
    try {
      this.debug.i('get', 'Generate new cache data', { key, tags, tl });
      const newData = await generator();
      if (newData) {
        const offsetTime = currentTime + (typeof tl === 'string' ? CACHE_TIME_TEMPLATE[tl] : tl);
        await this.set({ data: newData, key, onStorage, tags, tl: offsetTime });
      }
      return newData;
    } catch (e) {
      this.debug.i('get', 'Cant generate new data, failed to call generator', e);
      return null;
    }
  }

  public async getMany<T = unknown>(keys: string[]): Promise<T[]> {
    if (!this.activated) return [];

    this.debug.i('getMany', 'Call get all data by keys', keys);
    const data = [...(await this.storeCache.getMany(keys)), ...(await this.ramCache.getMany(keys))].filter(
      (item) => item !== undefined,
    );
    return data.map((item) => item?.data as T);
  }

  /**
   * Get an cache
   */
  public async set<T = unknown>({
    data,
    key,
    onStorage = false,
    tags = [],
    tl = DEFAULT_CACHE_TIME,
  }: {
    /**
     * Data to be cached
     */
    data: T;
    /**
     * Cache key
     */
    key: string;
    /**
     * Will store on storage if set to true
     */
    onStorage?: boolean;
    /**
     * Cache tags, depends tag for this cache
     */
    tags?: string[];
    /**
     * Time to live of this cache
     */
    tl?: keyof typeof CACHE_TIME_TEMPLATE | number;
  }): Promise<void> {
    if (!this.activated) return;
    this.debug.i('set', 'Incoming new cache', { data, key, tags, tl });
    const currentTime = Date.now();
    const offsetTime = currentTime + (typeof tl === 'string' ? CACHE_TIME_TEMPLATE[tl] : tl);
    await Promise.all([
      onStorage
        ? this.storeCache.set(key, {
            data,
            tags,
            ttl: offsetTime,
          })
        : undefined,
      this.ramCache.set(key, {
        data,
        tags,
        ttl: offsetTime,
      }),
    ]);
  }

  public setActivated(active: boolean) {
    this.activated = active;
  }

  public async setMany<T = unknown>(
    data: {
      data: T;
      key: string;
      onStorage?: boolean;
      tags?: string[];
      tl?: keyof typeof CACHE_TIME_TEMPLATE | number;
    }[],
  ): Promise<void> {
    if (!this.activated) return;

    const importData: [string, ICachedData, boolean][] = data.map((item) => {
      const { data: itemData, key, tags = [], tl = DEFAULT_CACHE_TIME } = item;
      const currentTime = Date.now();
      const offsetTime = currentTime + (typeof tl === 'string' ? CACHE_TIME_TEMPLATE[tl] : tl);
      return [key, { data: itemData, tags, ttl: offsetTime }, item.onStorage ?? false];
    });
    this.debug.i('setMany', 'Call set many data at once', { total: importData.length });
    await Promise.all([
      this.storeCache.setMany(importData.filter((item) => item[2]).map((item) => [item[0], item[1]])),
      this.ramCache.setMany(importData.filter((item) => !item[2]).map((item) => [item[0], item[1]])),
    ]);
  }
}

export { CacheManager };
