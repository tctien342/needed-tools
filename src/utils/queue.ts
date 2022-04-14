import { Logger } from './log';

export type TQueueJob = () => Promise<void> | void;

class QueueManager {
  /**
   * Job queue
   */
  queue: TQueueJob[];

  /**
   * Current processing jobs
   */
  processing: number;

  /**
   * Queue debug
   */
  debug: Logger;

  /**
   * Concurrent jobs
   */
  maxProcessing: number;

  constructor(name: string, maxProcessing = 4, log = true) {
    this.queue = [];
    this.processing = 0;
    this.maxProcessing = maxProcessing;
    this.debug = new Logger(name, log);
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
    void this.processJob();
  }

  /**
   * Add job into queue then wait for it to be done
   */
  wait<T = {}>(job: () => Promise<T>, high = false) {
    return new Promise((rs: (data: Awaited<ReturnType<typeof job>>) => void, rj) => {
      this.add(() => {
        job().then(rs).catch(rj);
      }, high);
    });
  }

  async processJob() {
    if (this.queue.length > 0 && this.processing < this.maxProcessing) {
      this.debug.i('processJob', 'Processing job in array', {
        length: this.queue.length,
        doing: this.processing,
      });
      const job = this.queue.shift();
      if (job) {
        this.processing++;
        try {
          await job();
        } catch (e) {
          this.debug.w('processJob', 'Failed process job', job);
        }
        this.processing--;
        void this.processJob();
      }
    }
  }
}

export { QueueManager };
