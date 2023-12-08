import { APIQueueItem } from '@utils/api';

describe('Test APIQueue class', () => {
  const api = () =>
    new APIQueueItem('https://jsonplaceholder.typicode.com/todos/1')
      .cache({
        tags: ['test'],
      })
      .storage()
      .get();
  test('Should call success', async () => {
    const data = await api();
    expect(data).toEqual({
      completed: false,
      id: 1,
      title: 'delectus aut autem',
      userId: 1,
    });
  });
  test('API should return text instead of json', async () => {
    const data = await new APIQueueItem('https://jsonplaceholder.typicode.com/todos/1').text().get();
    expect(typeof data).toEqual('string');
  });
  test('Should be cached correctly', async () => {
    const start = Date.now();
    await api();
    const end = Date.now();
    expect(end - start).toBeLessThan(10);
  });

  test('API hook should work', async () => {
    let beforeCall = false;
    APIQueueItem.setHook({
      beforeCall: async (url, config) => {
        beforeCall = true;
        return { config, url };
      },
      beforeReturn: async () => {
        return 'test';
      },
      onError: async (_error) => {
        return true;
      },
    });
    const data = await new APIQueueItem('https://jsonplaceholder.typicode.com/todos/1').get();
    expect(beforeCall).toEqual(true);
    expect(data).toEqual('test');
    // Expect error return true
    const error = await new APIQueueItem('https://jsonplaceholder.typicode.com/todos/-1').get();
    expect(error).toEqual(true);
  });

  test('API should be timeout', async () => {
    try {
      await new APIQueueItem('https://jsonplaceholder.typicode.com/todos/1').get({
        timeout: 1,
      });
    } catch (e) {
      expect(e.message).toEqual('The operation timed out.');
    }
  });
});
