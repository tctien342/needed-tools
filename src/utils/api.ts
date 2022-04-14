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
   * URL of this API Item
   */
  private url: string;
  /**
   * Queue mode of this API, defualt is low priority
   */
  private mode: 'low' | 'high' | 'now' = 'low';
  /**
   * Cache setting of this API
   */
  private cacheConfig: { tl: number; tags?: string[]; deps?: string[] } | null = null;

  /**
   * Set current instance into new axios instance for customize
   */
  static setApiInstance = (instance: AxiosInstance) => {
    ApiInstance = instance;
  };

  /**
   * Get current API queue manager instance
   */
  static getQueueInstance = () => ApiQueue;

  constructor(url: string) {
    this.url = url;
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
   * Add cache to this API, default is 2min
   */
  cache<T extends string>(conf: { tl?: keyof typeof CacheManager.TIME; tags?: T[]; deps?: T[] }) {
    this.cacheConfig = { ...conf, tl: CacheManager.TIME[conf.tl || '2min'] };
    return this;
  }

  /**
   * Call GET method
   */
  async get<T = {}>(config?: AxiosRequestConfig) {
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
        key: this.url,
        tl: this.cacheConfig.tl,
        tags: this.cacheConfig.tags,
        generator: getData,
      });
      if (data) return data;
    }
    return getData();
  }

  private async update<T = {}>(method: 'post' | 'put' | 'patch', data: any, config?: AxiosRequestConfig) {
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
   * Call POST method
   */
  async post<T = {}>(data: any, config?: AxiosRequestConfig) {
    return this.update<T>('post', data, config);
  }

  /**
   * Call PUT method
   */
  async put<T = {}>(data: any, config?: AxiosRequestConfig) {
    return this.update<T>('put', data, config);
  }

  /**
   * Call PATCH method
   */
  async patch<T = {}>(data: any, config?: AxiosRequestConfig) {
    return this.update<T>('patch', data, config);
  }

  /**
   * Call DELETE method
   */
  async delete<T = {}>(config?: AxiosRequestConfig) {
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
}

export { ApiCache, APIQueueItem };
