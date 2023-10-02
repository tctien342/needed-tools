import { APIQueueItem } from '@utils/api';

describe('Test APIQueue class', () => {
  test('Should call success', async () => {
    const data = await new APIQueueItem('https://jsonplaceholder.typicode.com/todos/1').get();
    expect(data).toEqual({
      completed: false,
      id: 1,
      title: 'delectus aut autem',
      userId: 1,
    });
  });
  test('Should be cached correctly', async () => {
    const start = Date.now();
    await new APIQueueItem('https://jsonplaceholder.typicode.com/todos/1').get();
    const end = Date.now();
    expect(end - start).toBeLessThan(100);
  });

  test('API hook should work', async () => {
    let beforeCall = false;
    APIQueueItem.setHook({
      beforeCall: (url, config) => {
        beforeCall = true;
        return { config, url };
      },
      beforeReturn: () => {
        return 'test';
      },
    });
    const data = await new APIQueueItem('https://jsonplaceholder.typicode.com/todos/1').get();
    expect(beforeCall).toEqual(true);
    expect(data).toEqual('test');
  });
});
