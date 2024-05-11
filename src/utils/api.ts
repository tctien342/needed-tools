/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheManager } from '@utils/cache';
import { QueueManager } from '@utils/queue';

import { CustomFetch } from './fetch';

type RequestInitWithTimeout = RequestInit & { timeout?: number };

const GlobalFetch = new CustomFetch();
const GlobalCacher = new CacheManager('GlobalAPI', true, false);
const GlobalApiQueue = new QueueManager('GlobalAPIQueue', 4, false);

class APIQueueItem {
  /**
   * Current API cache manager instance
   */
  static getCacheInstance = () => GlobalCacher;
  /**
   * Get global API queue manager instance
   */
  static getQueueInstance = () => GlobalApiQueue;
  /**
   * Global fetch's hook setting
   */
  static setHook = GlobalFetch.overrideHooks;

  /**
   * Cache setting of this API
   */
  private cacheConfig: { deps?: string[]; tags?: string[]; tl: number } | null = null;

  // Default is global cache instance
  private cacher = GlobalCacher;

  // Default is global fetch instance
  private caller = GlobalFetch;

  /**
   * Queue mode of this API, defualt is low priority
   */
  private mode: 'high' | 'low' | 'now' = 'low';

  private parseMode: 'default' | 'json' | 'text' = 'default';

  // Default is global queue instance
  private queuer = GlobalApiQueue;

  private storageType: 'local' | 'ram' = 'ram';

  /**
   * URL of this API Item
   */
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  static createInstance(caller: CustomFetch, queuer?: QueueManager, cacher?: CacheManager): typeof APIQueueItem {
    return class APIInstance extends APIQueueItem {
      constructor(url: string) {
        super(url);
        this.caller = caller;
        this.queuer = queuer || GlobalApiQueue;
        this.cacher = cacher || GlobalCacher;
      }
    };
  }

  private getParsedMethod() {
    switch (this.parseMode) {
      case 'json':
        return (res: Response) => res.json();
      case 'text':
        return (res: Response) => res.text();
      default:
        return undefined;
    }
  }

  private async update<T = unknown>(method: 'patch' | 'post' | 'put', data: any, config?: RequestInitWithTimeout) {
    let bodyData: any;
    if (data instanceof FormData || typeof data === 'string') {
      bodyData = data;
    } else {
      bodyData = JSON.stringify(data);
    }
    /*
     * Clear all it dependencys
     */
    if (this.cacheConfig?.deps) {
      void this.cacher.clearByTags(this.cacheConfig?.deps);
    }
    /**
     * API need process instantly
     */
    if (this.mode === 'now')
      return this.caller.call<T>(
        this.url,
        {
          body: bodyData,
          method: method.toUpperCase(),
          ...config,
        },
        this.getParsedMethod(),
      );
    /**
     * Add into queue
     */
    return this.queuer.wait(async () => {
      const result = await this.caller.call<T>(
        this.url,
        {
          body: bodyData,
          method: method.toUpperCase(),
          ...config,
        },
        this.getParsedMethod(),
      );
      return result;
    }, this.mode === 'high');
  }

  /**
   * Add cache to this API, default is 2min
   */
  cache<T extends string>(conf: { deps?: T[]; tags?: T[]; tl?: keyof typeof CacheManager.TIME }) {
    this.cacheConfig = { ...conf, tl: CacheManager.TIME[conf.tl || '2min'] };
    return this;
  }

  /**
   * Call DELETE method
   */
  async delete<T = unknown>(config?: RequestInitWithTimeout) {
    /*
     * Clear all it dependencys
     */
    if (this.cacheConfig?.deps) {
      void this.cacher.clearByTags(this.cacheConfig?.deps);
    }
    /**
     * API need process instantly
     */
    if (this.mode === 'now') {
      return this.caller.call<T>(
        this.url,
        {
          method: 'DELETE',
          ...config,
        },
        this.getParsedMethod(),
      );
    }
    /**
     * Add into queue
     */
    return this.queuer.wait(async () => {
      const result = await this.caller.call<T>(
        this.url,
        {
          method: 'DELETE',
          ...config,
        },
        this.getParsedMethod(),
      );
      return result;
    }, this.mode === 'high');
  }

  /**
   * Call GET method
   */
  async get<T = unknown>(config?: RequestInitWithTimeout) {
    /**
     * Clear all it dependency
     */
    const getData = async () => {
      if (this.cacheConfig?.deps) {
        void this.cacher.clearByTags(this.cacheConfig?.deps);
      }
      try {
        const call = async () => {
          const data = await this.caller.call<T>(
            this.url,
            {
              method: 'GET',
              ...config,
            },
            this.getParsedMethod(),
          );
          return data;
        };
        /**
         * API need process instantly
         */
        if (this.mode === 'now') {
          return call();
        }
        /**
         * Add into queue
         */
        const result = await this.queuer.wait(async () => {
          return call();
        }, this.mode === 'high');
        return result;
      } catch (e) {
        throw e;
      }
    };
    if (this.cacheConfig) {
      const data = await this.cacher.get({
        generator: getData,
        key: this.url,
        onStorage: this.storageType === 'local',
        tags: this.cacheConfig.tags,
        tl: this.cacheConfig.tl,
      });
      if (data) return data;
    }
    return getData();
  }

  getCacher() {
    return this.cacher;
  }

  getCaller() {
    return this.caller;
  }

  getQueuer() {
    return this.queuer;
  }

  /**
   * Set this API to high priority
   */
  high() {
    this.mode = 'high';
    return this;
  }

  json() {
    this.parseMode = 'json';
    return this;
  }

  /**
   * Set this to instantly API
   */
  now() {
    this.mode = 'now';
    return this;
  }

  /**
   * Call PATCH method
   */
  async patch<T = unknown>(data: any, config?: RequestInitWithTimeout) {
    return this.update<T>('patch', data, config);
  }

  /**
   * Call POST method
   */
  async post<T = unknown>(data: any, config?: RequestInitWithTimeout) {
    return this.update<T>('post', data, config);
  }

  /**
   * Call PUT method
   */
  async put<T = unknown>(data: any, config?: RequestInitWithTimeout) {
    return this.update<T>('put', data, config);
  }

  public setCaller(caller: CustomFetch) {
    this.caller = caller;
    return this;
  }

  /**
   * Set this API to be cached in storage
   */
  storage() {
    this.storageType = 'local';
    return this;
  }

  text() {
    this.parseMode = 'text';
    return this;
  }
}

export { APIQueueItem, GlobalCacher as ApiCache };
