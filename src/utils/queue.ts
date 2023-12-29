import { LinkedListQueue } from 'queue-typed';

import { Logger } from './log';

export type TQueueJob = () => Promise<void> | void;

class QueueManager {
  /**
   * Queue debug
   */
  debug: Logger;

  /**
   * Concurrent jobs
   */
  maxProcessing: number;

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
    this.maxProcessing = maxProcessing;
    this.debug = new Logger(name, log);
    return this;
  }

  private async work() {
    if (!this.queue.isEmpty() && this.processing < this.maxProcessing) {
      this.debug.i('work', 'Found job available, working on it', {
        availableThread: this.maxProcessing - this.processing,
        count: this.queue.length,
      });
      const job = this.queue.dequeue();
      if (job) {
        this.processing++;
        try {
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
      this.queue.enqueue(job);
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
