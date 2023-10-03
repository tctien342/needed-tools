import { UseStore, clear, createStore, del, entries, get, getMany, set, setMany, update } from 'idb-keyval';
import { LRUCache } from 'lru-cache';
import { LocalStorage } from 'node-localstorage';

import { Logger } from './log';

if (typeof localStorage === 'undefined' || localStorage === null) {
  global.localStorage = new LocalStorage('./.tmp-storage');
}

class StorageManager<T extends object> {
  loadStatus: 'init' | 'loaded';
  log: Logger;
  store:
    | {
        store: LRUCache<string, T, unknown>;
        type: 'ram';
      }
    | {
        store: UseStore;
        type: 'idb';
      }
    | {
        store: string;
        type: 'local';
      };
  storeName: string;

  constructor(name: string, opts?: { log?: boolean; ramCache?: boolean }) {
    this.loadStatus = 'init';
    this.storeName = name;
    this.log = new Logger(`Storage ${name}`, opts?.log ?? true);
    if (opts?.ramCache) {
      this.createRamCache();
    } else {
      this.createStore();
    }
  }

  private async createRamCache(): Promise<void> {
    this.store = {
      store: new LRUCache({
        max: 500,
        maxSize: 1024 * 1024 * 10,
        sizeCalculation: (item) => JSON.stringify(item).length,
        ttl: 1000 * 60 * 60 * 24 * 7,
      }),
      type: 'ram',
    };
    this.loadStatus = 'loaded';
    this.log.i('createRamCache', 'Create ram cache store');
  }

  private async createStore(): Promise<void> {
    const isIDBAvailable = await this.isIDBAvailable();
    const isLocalStorageAvailable = await this.isLocalStorageAvailable();
    if (isIDBAvailable) {
      this.store = {
        store: createStore(this.storeName, this.storeName),
        type: 'idb',
      };
      this.loadStatus = 'loaded';
      this.log.i('createStore', 'Success connect to store');
      return;
    }
    if (isLocalStorageAvailable) {
      this.store = {
        store: `SM_${this.storeName}`,
        type: 'local',
      };
      this.loadStatus = 'loaded';
      this.log.i('createStore', 'IDB not supported, fallback to local storage');
      return;
    }
    // Fall back to ram cache
    return this.createRamCache();
  }

  private async isIDBAvailable(): Promise<boolean> {
    // Detect if is NodeJS
    if (typeof window === 'undefined') return false;

    return set('IDB_TEST_WRITE', 'SUCCESS_WRITE_TO_DB')
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }

  private async isLocalStorageAvailable(): Promise<boolean> {
    try {
      localStorage.setItem('LOCAL_TEST_WRITE', 'SUCCESS_WRITE_TO_LOCAL');
      localStorage.removeItem('LOCAL_TEST_WRITE');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Clear all available data in storage
   */
  async clear(): Promise<void> {
    if (this.loadStatus !== 'loaded') return;
    if (this.store.type === 'idb') {
      return clear(this.store.store);
    }
    if (this.store.type === 'local') {
      localStorage.removeItem(this.store.store);
      return Promise.resolve();
    }
    this.store.store.clear();
  }

  async entries(): Promise<[string, T][]> {
    if (this.loadStatus !== 'loaded') return [];
    if (this.store.type === 'idb') {
      return entries(this.store.store);
    }
    if (this.store.type === 'local') {
      const data = localStorage.getItem(this.store.store);
      if (data === null) return [];
      const parsed = JSON.parse(data);
      return Object.entries(parsed);
    }
    return this.store.store.dump().map((item) => [item[0], item[1].value]);
  }

  async get(key: string): Promise<T | undefined> {
    if (this.loadStatus !== 'loaded') return undefined;
    if (this.store.type === 'idb') {
      return get<T>(key, this.store.store);
    }
    if (this.store.type === 'local') {
      const data = localStorage.getItem(this.store.store);
      if (data === null) return undefined;
      const parsed = JSON.parse(data);
      return parsed[key];
    }
    return this.store.store.get(key);
  }

  async getMany(keys: string[]): Promise<(T | undefined)[]> {
    if (this.loadStatus !== 'loaded') return [];
    if (this.store.type === 'idb') {
      return getMany<T>(keys, this.store.store);
    }
    if (this.store.type === 'local') {
      const data = localStorage.getItem(this.store.store);
      if (data === null) return [];
      const parsed = JSON.parse(data);
      return keys.map((key) => parsed[key]);
    }
    return Promise.all(keys.map((key) => (this.store.store as LRUCache<string, T, unknown>).get(key)));
  }

  async remove(key: string): Promise<void> {
    if (this.loadStatus !== 'loaded') return Promise.resolve();
    if (this.store.type === 'idb') {
      return del(key, this.store.store);
    }
    if (this.store.type === 'local') {
      const data = localStorage.getItem(this.store.store);
      if (data === null) return Promise.resolve();
      const parsed = JSON.parse(data);
      delete parsed[key];
      localStorage.setItem(this.store.store, JSON.stringify(parsed));
      return Promise.resolve();
    }
    this.store.store.delete(key);
  }

  async set(key: string, value: T) {
    if (this.loadStatus !== 'loaded') return Promise.resolve();
    if (this.store.type === 'idb') {
      return set(key, value, this.store.store);
    }
    if (this.store.type === 'local') {
      const data = localStorage.getItem(this.store.store);
      if (data === null) {
        localStorage.setItem(this.store.store, JSON.stringify({ [key]: value }));
        return Promise.resolve();
      }
      const parsed = JSON.parse(data);
      parsed[key] = value;
      localStorage.setItem(this.store.store, JSON.stringify(parsed));
      return Promise.resolve();
    }
    this.store.store.set(key, value);
  }

  async setMany(data: [string, T][]) {
    if (this.loadStatus !== 'loaded') return Promise.resolve();
    if (this.store.type === 'idb') {
      return setMany(data, this.store.store);
    }
    if (this.store.type === 'local') {
      const storeData = data.reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as { [key: string]: T },
      );
      localStorage.setItem(this.store.store, JSON.stringify(storeData));
      return Promise.resolve();
    }
    data.forEach(([key, value]) => {
      (this.store.store as LRUCache<string, T, unknown>).set(key, value);
    });
  }

  async update(key: string, fn: (val: T) => T) {
    if (this.loadStatus !== 'loaded') return Promise.resolve();
    if (this.store.type === 'idb') {
      return update(key, fn, this.store.store);
    }
    const current = await this.get(key);
    if (current === undefined) return Promise.resolve();
    const updated = fn(current);
    return this.set(key, updated);
  }

  get isAvailable(): boolean {
    return this.loadStatus === 'loaded';
  }

  get type(): 'idb' | 'local' | 'ram' {
    return this.store.type;
  }
}

export { StorageManager };
