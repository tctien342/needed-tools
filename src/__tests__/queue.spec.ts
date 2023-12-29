import { QueueManager } from '@utils/queue';

describe('Test QueueManager class', () => {
  let queue: QueueManager;

  beforeEach(() => {
    queue = new QueueManager('test-queue', 2, false);
  });

  afterEach(() => {
    queue.clear();
  });

  test('Should add and process jobs in the queue', async () => {
    const job1 = jest.fn().mockResolvedValue('Job 1');
    const job2 = jest.fn().mockResolvedValue('Job 2');
    const job3 = jest.fn().mockResolvedValue('Job 3');

    queue.add(job1).add(job2).add(job3);

    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for jobs to be processed

    expect(job1).toHaveBeenCalledTimes(1);
    expect(job2).toHaveBeenCalledTimes(1);
    expect(job3).toHaveBeenCalledTimes(1);
  });

  test('Should process high priority jobs first', async () => {
    let A = 1;
    const job = jest.fn().mockResolvedValue('Job');

    queue.maxProcessing = 1; // Only process one job at a time
    queue
      .add(job)
      .add(() => {
        A = 2; // Should be last
      })
      .add(() => {
        A = 3;
      }, true); // High priority job

    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for jobs to be processed

    expect(job).toHaveBeenCalledTimes(1);
    expect(A).toBe(2);
  });

  test('Should wait for job to be done', async () => {
    const job = jest.fn().mockResolvedValue('Job');

    const result = await queue.wait(job);

    expect(job).toHaveBeenCalledTimes(1);
    expect(result).toBe('Job');
  });

  test('Should handle job failure', async () => {
    const job = jest.fn().mockRejectedValue(new Error('Job failed'));

    await queue.wait(job).catch((error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Job failed');
    });

    expect(job).toHaveBeenCalledTimes(1);
  });

  test('Should clear all jobs and queue', async () => {
    const jobA = jest.fn().mockResolvedValue('Job');
    const jobB = jest.fn().mockResolvedValue('Job');

    // Only clear not processing jobs
    queue.maxProcessing = 1;
    queue.add(jobA).add(jobB);
    queue.clear();

    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for jobs to be processed

    expect(jobB).not.toHaveBeenCalled();
  });
});
