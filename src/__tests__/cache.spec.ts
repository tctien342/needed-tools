import { CacheManager } from '../utils/cache';

describe('CacheManager', () => {
  const cacheManager = new CacheManager('TestCache');

  afterAll(() => {
    cacheManager.clear();
  });

  it('should set and get cache data', async () => {
    const data = { age: 30, name: 'John' };
    const key = 'user';
    await cacheManager.set({ data, key });
    const cachedData = await cacheManager.get<typeof data>({ key });
    expect(cachedData).toEqual(data);
  });

  it('should return null if cache data is expired', async () => {
    const data = { age: 30, name: 'John' };
    const key = 'user';
    await cacheManager.set({ data, key, tl: -1 }); // set cache to expire immediately
    const cachedData = await cacheManager.get<typeof data>({ key });
    expect(cachedData).toBeNull();
  });

  it('should remove cache data by tag', async () => {
    const data = { age: 30, name: 'John' };
    const key = 'user';
    const tag = 'user';
    await cacheManager.set({ data, key, tags: [tag] });
    await cacheManager.clearByTag(tag);
    const cachedData = await cacheManager.get<typeof data>({ key });
    expect(cachedData).toBeNull();
  });

  it('should remove cache data by tags', async () => {
    const data = { age: 30, name: 'John' };
    const key = 'user';
    const tags = ['user', 'profile'];
    await cacheManager.set({ data, key, tags });
    await cacheManager.clearByTags(tags);
    const cachedData = await cacheManager.get<typeof data>({ key });
    expect(cachedData).toBeNull();
  });

  it('should set and get many cache data', async () => {
    const data1 = { age: 30, name: 'John' };
    const key1 = 'user1';
    const data2 = { age: 25, name: 'Jane' };
    const key2 = 'user2';
    await cacheManager.setMany([
      { data: data1, key: key1 },
      { data: data2, key: key2 },
    ]);
    const cachedData = await cacheManager.getMany<typeof data1 | typeof data2>([key1, key2]);
    expect(cachedData).toEqual([data1, data2]);
  });
});
