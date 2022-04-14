import { CACHE_TIME_TEMPLATE, DEFAULT_CACHE_TIME } from '@constants/cache';
import { clear, createStore, del, entries, get, getMany, set, setMany, UseStore } from 'idb-keyval';

import { Logger } from './log';

interface ICachedData<T = {}> {
  /**
   * Cached data
   */
  data: T;
  /**
   * Time to live of data
   */
  ttl: number;
  /**
   * Tag for this cache
   */
  tags?: string[];
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
  store: UseStore;
  storeName: string;
  loadStatus: 'init' | 'denied' | 'loaded';

  constructor(storeName: string, activated = true, log = true) {
    this.activated = activated;
    this.loadStatus = 'init';
    this.storeName = storeName;
    this.debug = new Logger(`CACHE_${storeName}`, log);
    this.createStore();
  }

  private createStore(): void {
    set('IDB_TEST_WRITE', 'SUCCESS_WRITE_TO_DB')
      .then(() => {
        /**
         * IDB is accepted to transfer data
         */
        this.store = createStore(this.storeName, this.storeName);
        this.loadStatus = 'loaded';
        this.debug.i('createStore', 'Success connect to store');
      })
      .catch(() => {
        this.loadStatus = 'denied';
        this.debug.w('createStore', 'Failed to create store, indexDB not allow to write');
      });
  }

  public setActivated(active: boolean) {
    this.activated = active;
  }

  /**
   * Remove all cache
   */
  public clear(): void {
    if (this.loadStatus !== 'loaded' || !this.activated) return;

    this.debug.i('clear', 'Triggered');
    clear(this.store);
  }

  /**
   * Clean current cache
   */
  public async clean(opts?: { tag?: string; tags?: string[] }): Promise<void> {
    if (this.loadStatus !== 'loaded' || !this.activated) return;

    this.debug.i('clean', 'Triggered with option', opts);
    const currentData: [IDBValidKey, ICachedData][] = await entries(this.store);
    const currentTime = Date.now();
    for (const cacheItem of currentData) {
      if (cacheItem[1].ttl < currentTime) {
        await del(cacheItem[0], this.store);
        continue;
      }
      if (cacheItem[1].tags) {
        if (opts?.tag) {
          if (cacheItem[1].tags.includes(opts.tag)) {
            await del(cacheItem[0], this.store);
            continue;
          }
        }
        if (opts?.tags) {
          if (cacheItem[1].tags.filter((tag) => opts.tags?.includes(tag)).length > 0) {
            await del(cacheItem[0], this.store);
          }
        }
      }
    }
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
   * Get an cache
   */
  public async set<T = {}>({
    key,
    data,
    tl = DEFAULT_CACHE_TIME,
    tags = [],
  }: {
    key: string;
    data: T;
    tl?: keyof typeof CACHE_TIME_TEMPLATE | number;
    tags?: string[];
  }): Promise<void> {
    if (this.loadStatus !== 'loaded' || !this.activated) return;

    this.debug.i('set', 'Incomming new cache', { key, tl, tags, data });
    const currentTime = Date.now();
    const offsetTime = currentTime + (typeof tl === 'string' ? CACHE_TIME_TEMPLATE[tl] : tl);
    await set(
      key,
      {
        data,
        ttl: offsetTime,
        tags,
      },
      this.store,
    );
  }

  /**
   * Set an cache
   */
  public async get<T = {}>({
    key,
    tl = DEFAULT_CACHE_TIME,
    tags = [],
    generator,
  }: {
    key: string;
    tl?: keyof typeof CACHE_TIME_TEMPLATE | number;
    tags?: string[];
    generator?: () => Promise<T>;
  }): Promise<T | null> {
    if (this.loadStatus !== 'loaded' || !this.activated) return generator?.() || null;

    const currentData = await get<ICachedData<T>>(key, this.store);
    const currentTime = Date.now();

    if (currentData && currentTime <= currentData.ttl) {
      this.debug.i('get', 'Getting cache data', { key, tl, tags });
      return currentData.data;
    }

    if (!generator) return null;
    try {
      this.debug.i('get', 'Generate new cache data', { key, tl, tags });
      const newData = await generator();
      if (newData) {
        const offsetTime = currentTime + (typeof tl === 'string' ? CACHE_TIME_TEMPLATE[tl] : tl);
        await set(
          key,
          {
            data: newData,
            ttl: offsetTime,
            tags,
          },
          this.store,
        );
      }
      return newData;
    } catch (e) {
      this.debug.i('get', 'Cant generate new data, failed to call generator', e);
      return null;
    }
  }

  public async setMany<T = {}>(
    data: { key: string; tl?: keyof typeof CACHE_TIME_TEMPLATE | number; tags?: string[]; data: T }[],
  ): Promise<void> {
    if (this.loadStatus !== 'loaded' || !this.activated) return;

    const importData: [string, ICachedData][] = data.map((item) => {
      const { key, tl = DEFAULT_CACHE_TIME, tags = [], data: itemData } = item;
      const currentTime = Date.now();
      const offsetTime = currentTime + (typeof tl === 'string' ? CACHE_TIME_TEMPLATE[tl] : tl);
      return [key, { data: itemData, ttl: offsetTime, tags }];
    });
    this.debug.i('setMany', 'Call set many data at once', { total: importData.length });
    await setMany(importData, this.store);
  }

  public async getMany<T = {}>(keys: string[]): Promise<T[]> {
    if (this.loadStatus !== 'loaded' || !this.activated) return [];

    this.debug.i('getMany', 'Call get all data by keys', keys);
    const data = await getMany(keys, this.store);
    return data;
  }
}

export { CacheManager };
