/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheManager } from '@utils/cache';
import { QueueManager } from '@utils/queue';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const ApiQueue = new QueueManager('APIQueue');
let ApiCache: CacheManager;
let ApiInstance: AxiosInstance = axios;

if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
  ApiCache = new CacheManager('API');
  ApiInstance = axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

class APIQueueItem {
  /**
   * Get current API queue manager instance
   */
  static getQueueInstance = () => ApiQueue;
  /**
   * Set current instance into new axios instance for customize
   */
  static setApiInstance = (instance: AxiosInstance) => {
    ApiInstance = instance;
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
  private async update<T = unknown>(method: 'patch' | 'post' | 'put', data: any, config?: AxiosRequestConfig) {
    /*
     * Clear all it dependencys
     */
    if (this.cacheConfig?.deps) {
      void ApiCache.clearByTags(this.cacheConfig?.deps);
    }
    /**
     * API need process instantly
     */
    if (this.mode === 'now') return ApiInstance[method]<T>(this.url, data, config);
    /**
     * Add into queue
     */
    return ApiQueue.wait(async () => {
      const result = await ApiInstance[method]<T>(this.url, data, config);
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
  async delete<T = unknown>(config?: AxiosRequestConfig) {
    /*
     * Clear all it dependencys
     */
    if (this.cacheConfig?.deps) {
      void ApiCache.clearByTags(this.cacheConfig?.deps);
    }
    /**
     * API need process instantly
     */
    if (this.mode === 'now') return ApiInstance.delete<T>(this.url, config);
    /**
     * Add into queue
     */
    return ApiQueue.wait(async () => {
      const result = await ApiInstance.delete<T>(this.url, config);
      return result;
    }, this.mode === 'high');
  }

  /**
   * Call GET method
   */
  async get<T = unknown>(config?: AxiosRequestConfig) {
    /**
     * Clear all it dependencys
     */
    const getData = async () => {
      if (this.cacheConfig?.deps) {
        void ApiCache.clearByTags(this.cacheConfig?.deps);
      }
      try {
        const call = async () => {
          const data = await ApiInstance.get<T>(this.url, config);
          return data.data;
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
  async patch<T = unknown>(data: any, config?: AxiosRequestConfig) {
    return this.update<T>('patch', data, config);
  }

  /**
   * Call POST method
   */
  async post<T = unknown>(data: any, config?: AxiosRequestConfig) {
    return this.update<T>('post', data, config);
  }

  /**
   * Call PUT method
   */
  async put<T = unknown>(data: any, config?: AxiosRequestConfig) {
    return this.update<T>('put', data, config);
  }
}

export { APIQueueItem, ApiCache };
