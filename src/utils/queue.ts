import { LinkedListQueue } from 'queue-typed';

import { delay } from './common';
import { Logger } from './log';

export type TQueueJob = () => Promise<void> | void;

class QueueManager {
  /**
   * Queue debug
   */
  debug: Logger;

  /**
   * Limit jobs per second
   */
  limitPerSecond: number;

  /**
   * Concurrent jobs
   */
  maxProcessing: number;

  /**
   * Total processed jobs per seccond
   */
  processed: number;

  /**
   * Current processing jobs
   */
  processing: number;

  /**
   * Job queue
   */
  queue: LinkedListQueue<TQueueJob>;

  constructor(name: string, maxProcessing = 4, log = true) {
    this.queue = new LinkedListQueue<TQueueJob>();
    this.processing = 0;
    this.processed = 0;
    this.limitPerSecond = 0;
    this.maxProcessing = maxProcessing;
    this.debug = new Logger(name, log);
    this.clearProcessed();
    return this;
  }

  private async clearProcessed(): Promise<void> {
    this.processed = 0;
    await delay(1000);
    return this.clearProcessed();
  }

  private async waitForLimit(): Promise<void> {
    if (!this.limitPerSecond) return;
    if (this.processed > this.limitPerSecond) {
      await delay(10);
      return this.waitForLimit();
    }
  }

  private async work() {
    if (!this.queue.isEmpty() && this.processing < this.maxProcessing) {
      this.debug.i('work', 'Found job available, working on it', {
        availableThread: this.maxProcessing - this.processing,
        count: this.queue.size,
      });
      const job = this.queue.shift();
      if (job) {
        this.processed++;
        this.processing++;
        try {
          await this.waitForLimit();
          await job();
        } catch (e) {
          this.debug.w('work', 'Failed on processing job', job);
        }
        this.processing--;
        void this.work();
      }
    }
  }

  /**
   * Add and job into queue
   */
  add(job: TQueueJob, high = false) {
    if (high) {
      this.queue.unshift(job);
    } else {
      this.queue.push(job);
    }
    void this.work();
    return this;
  }

  /**
   * Clear all job and queue
   */
  clear() {
    this.queue.clear();
    this.processing = 0;
    return this;
  }

  setLimitPerSecond(limit: number) {
    this.limitPerSecond = limit;
    return this;
  }

  /**
   * Add job into queue then wait for it to be done
   */
  wait<T = unknown>(job: () => Promise<T>, high = false) {
    return new Promise((rs: (data: Awaited<ReturnType<typeof job>>) => void, rj) => {
      this.add(() => {
        job().then(rs).catch(rj);
      }, high);
    });
  }
}

export { QueueManager };
