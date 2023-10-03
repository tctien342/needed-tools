import { Level } from 'level';
import { LRUCache } from 'lru-cache';

import { Logger } from './log';

class StorageManager<T extends object> {
  loadStatus: 'init' | 'loaded';
  log: Logger;
  store:
    | {
        store: LRUCache<string, T, unknown>;
        type: 'ram';
      }
    | {
        store: Level<string, T>;
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
    try {
      this.store = {
        store: new Level<string, T>(`./.tmp-storage/${this.storeName}`, { valueEncoding: 'json' }),
        type: 'local',
      };
      await this.store.store.open();
      this.loadStatus = 'loaded';
      this.log.i('createStore', 'IDB not supported, fallback to local storage');
      return;
    } catch (e) {
      // Fall back to ram cache
      return this.createRamCache();
    }
  }

  /**
   * Clear all available data in storage
   */
  async clear(): Promise<void> {
    if (this.loadStatus !== 'loaded') await this.waitForLoad();
    return this.store.store.clear();
  }

  async entries(): Promise<[string, T][]> {
    if (this.loadStatus !== 'loaded') await this.waitForLoad();
    if (this.store.type === 'local') {
      return this.store.store
        .iterator({})
        .all()
        .then((items) => items.map((item) => [item[0], item[1] as T]));
    }
    return this.store.store.dump().map((item) => [item[0], item[1].value]);
  }

  async get(key: string): Promise<T | undefined> {
    if (this.loadStatus !== 'loaded') await this.waitForLoad();
    if (this.store.type === 'local') {
      return this.store.store.get(key).catch(() => undefined);
    }
    return this.store.store.get(key);
  }

  async getMany(keys: string[]): Promise<(T | undefined)[]> {
    if (this.loadStatus !== 'loaded') await this.waitForLoad();
    if (this.store.type === 'local') {
      return this.store.store.getMany(keys);
    }
    return Promise.all(keys.map((key) => (this.store.store as LRUCache<string, T, unknown>).get(key)));
  }

  async remove(key: string): Promise<void> {
    if (this.loadStatus !== 'loaded') await this.waitForLoad();
    if (this.store.type === 'local') {
      return this.store.store.del(key);
    }
    this.store.store.delete(key);
  }

  async set(key: string, value: T) {
    if (this.loadStatus !== 'loaded') await this.waitForLoad();
    if (this.store.type === 'local') {
      return this.store.store.put(key, value);
    }
    this.store.store.set(key, value);
  }

  async setMany(data: [string, T][]) {
    if (this.loadStatus !== 'loaded') await this.waitForLoad();
    if (this.store.type === 'local') {
      return this.store.store.batch(
        data.map(([key, value]) => ({
          key,
          type: 'put',
          value,
        })),
      );
    }
    data.forEach(([key, value]) => {
      (this.store.store as LRUCache<string, T, unknown>).set(key, value);
    });
  }

  async update(key: string, fn: (val: T) => T) {
    if (this.loadStatus !== 'loaded') await this.waitForLoad();
    const current = await this.get(key);
    if (current === undefined) return Promise.resolve();
    const updated = fn(current);
    return this.set(key, updated);
  }

  public waitForLoad(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.loadStatus === 'loaded') {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  get isAvailable(): boolean {
    return this.loadStatus === 'loaded';
  }

  get type(): 'local' | 'ram' {
    return this.store.type;
  }
}

export { StorageManager };
