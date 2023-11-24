/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheManager } from '@utils/cache';
import { QueueManager } from '@utils/queue';

type RequestInitWithTimeout = RequestInit & { timeout?: number };

const ApiCache = new CacheManager('API');

let APIHook = {
  beforeCall: (url: string, config: RequestInitWithTimeout) => {
    return { config, url };
  },
  beforeReturn: (data: any, _config: RequestInitWithTimeout) => {
    return data;
  },
  onError: (error: Response, _config: RequestInitWithTimeout) => {
    throw error;
  },
  onParse: (res: Response) => {
    return res.json();
  },
};

const ApiQueue = new QueueManager('APIQueue');

function tFetch<TResponse>(
  url: string,
  // `RequestInit` is a type for configuring
  // a `fetch` request. By default, an empty object.
  config: RequestInitWithTimeout = {},
  // Override default parse
  onParse?: (res: Response) => Promise<TResponse>,
): Promise<TResponse> {
  // Inside, we call the `fetch` function with
  // a URL and config given:
  const { config: newConfig, url: newUrl } = APIHook.beforeCall(url, config);

  // If we have a timeout, we set up a timeout:
  if (config.timeout) {
    const signal = AbortSignal.timeout(config.timeout);
    newConfig.signal = signal;
  }

  return (
    fetch(newUrl, newConfig)
      // When got a response call a `json` method on it
      .then((response) => {
        if (response.ok) {
          if (onParse) return onParse(response);
          return APIHook.onParse(response);
        }
        throw response;
      })
      .then((data) => APIHook.beforeReturn(data, newConfig))
      // If something went wrong, we catch an error
      // and throw it again to stop the execution.
      .catch((error) => APIHook.onError(error as Response, newConfig))
  );
}

class APIQueueItem {
  /**
   * Current API cache manager instance
   */
  static getCacheInstance = () => ApiCache;
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

  private parseMode: 'default' | 'json' | 'text' = 'default';

  private storageType: 'local' | 'ram' = 'ram';

  /**
   * URL of this API Item
   */
  private url: string;

  constructor(url: string) {
    this.url = url;
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
    if (data instanceof FormData) {
      bodyData = data;
    } else {
      bodyData = JSON.stringify(data);
    }
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
      return tFetch<T>(
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
    return ApiQueue.wait(async () => {
      const result = await tFetch<T>(
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
      void ApiCache.clearByTags(this.cacheConfig?.deps);
    }
    /**
     * API need process instantly
     */
    if (this.mode === 'now') {
      return tFetch<T>(
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
    return ApiQueue.wait(async () => {
      const result = await tFetch<T>(
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
        void ApiCache.clearByTags(this.cacheConfig?.deps);
      }
      try {
        const call = async () => {
          const data = await tFetch<T>(
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
        onStorage: this.storageType === 'local',
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

export { APIQueueItem, ApiCache };
