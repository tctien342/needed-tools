/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheManager } from '@utils/cache';
import { QueueManager } from '@utils/queue';

let ApiCache: CacheManager;
let APIHook = {
  beforeCall: (url: string, config: RequestInit) => {
    return { config, url };
  },
  beforeReturn: (data: any) => {
    return data;
  },
  onError: (error: Error) => {
    throw error;
  },
};

const ApiQueue = new QueueManager('APIQueue');

if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
  ApiCache = new CacheManager('API');
}

function tFetch<TResponse>(
  url: string,
  // `RequestInit` is a type for configuring
  // a `fetch` request. By default, an empty object.
  config: RequestInit = {},

  // This function is async, it will return a Promise:
): Promise<TResponse> {
  // Inside, we call the `fetch` function with
  // a URL and config given:
  const { config: newConfig, url: newUrl } = APIHook.beforeCall(url, config);
  return (
    fetch(newUrl, newConfig)
      // When got a response call a `json` method on it
      .then((response) => response.json())
      // and return the result data.
      .then((data) => APIHook.beforeReturn(data))
      // If something went wrong, we catch an error
      // and throw it again to stop the execution.
      .catch((error) => APIHook.onError(error))
  );
}

class APIQueueItem {
  /**
   * Get current API queue manager instance
   */
  static getQueueInstance = () => ApiQueue;

  /**
   * API hook setting
   */
  static setHook = (hook: Partial<typeof APIHook>) => {
    APIHook = { ...APIHook, ...hook };
  };

  /**
   * Cache setting of this API
   */
  private cacheConfig: { deps?: string[]; tags?: string[]; tl: number } | null = null;

  /**
   * Queue mode of this API, defualt is low priority
   */
  private mode: 'high' | 'low' | 'now' = 'low';

  /**
   * URL of this API Item
   */
  private url: string;

  constructor(url: string) {
    this.url = url;
  }
  private async update<T = unknown>(method: 'patch' | 'post' | 'put', data: any, config?: RequestInit) {
    /*
     * Clear all it dependencys
     */
    if (this.cacheConfig?.deps) {
      void ApiCache.clearByTags(this.cacheConfig?.deps);
    }
    /**
     * API need process instantly
     */
    if (this.mode === 'now')
      return tFetch<T>(this.url, {
        body: JSON.stringify(data),
        method: method.toUpperCase(),
        ...config,
      });
    /**
     * Add into queue
     */
    return ApiQueue.wait(async () => {
      const result = await tFetch<T>(this.url, {
        body: JSON.stringify(data),
        method: method.toUpperCase(),
        ...config,
      });
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
  async delete<T = unknown>(config?: RequestInit) {
    /*
     * Clear all it dependencys
     */
    if (this.cacheConfig?.deps) {
      void ApiCache.clearByTags(this.cacheConfig?.deps);
    }
    /**
     * API need process instantly
     */
    if (this.mode === 'now') {
      return tFetch<T>(this.url, {
        method: 'DELETE',
        ...config,
      });
    }
    /**
     * Add into queue
     */
    return ApiQueue.wait(async () => {
      const result = await tFetch<T>(this.url, {
        method: 'DELETE',
        ...config,
      });
      return result;
    }, this.mode === 'high');
  }

  /**
   * Call GET method
   */
  async get<T = unknown>(config?: RequestInit) {
    /**
     * Clear all it dependency
     */
    const getData = async () => {
      if (this.cacheConfig?.deps) {
        void ApiCache.clearByTags(this.cacheConfig?.deps);
      }
      try {
        const call = async () => {
          const data = await tFetch<T>(this.url, {
            method: 'GET',
            ...config,
          });
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
        const result = await ApiQueue.wait(async () => {
          return call();
        }, this.mode === 'high');
        return result;
      } catch (e) {
        throw e;
      }
    };
    if (this.cacheConfig) {
      const data = await ApiCache.get({
        generator: getData,
        key: this.url,
        tags: this.cacheConfig.tags,
        tl: this.cacheConfig.tl,
      });
      if (data) return data;
    }
    return getData();
  }

  /**
   * Set this API to high priority
   */
  high() {
    this.mode = 'high';
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
  async patch<T = unknown>(data: any, config?: RequestInit) {
    return this.update<T>('patch', data, config);
  }

  /**
   * Call POST method
   */
  async post<T = unknown>(data: any, config?: RequestInit) {
    return this.update<T>('post', data, config);
  }

  /**
   * Call PUT method
   */
  async put<T = unknown>(data: any, config?: RequestInit) {
    return this.update<T>('put', data, config);
  }
}

export { APIQueueItem, ApiCache };
