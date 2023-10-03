import { StorageManager } from '@utils/storage';

describe('StorageManager', () => {
  const storageManager = new StorageManager('TestStorage');
  const testValue = { value: 'value' };

  afterAll(() => {
    storageManager.clear();
  });

  describe('set&get', () => {
    it('should set an item in storageManager', async () => {
      await storageManager.set('key', testValue);
      expect(await storageManager.get('key')).toStrictEqual(testValue);
    });
    it('should return null if the item does not exist', async () => {
      expect(await storageManager.get('123asd')).toBeUndefined();
    });
  });

  describe('removeItem', () => {
    it('should remove an item from storageManager', async () => {
      await storageManager.set('key', testValue);
      await storageManager.remove('key');
      expect(await storageManager.get('key')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all items from storageManager', async () => {
      await storageManager.set('key1', testValue);
      await storageManager.set('key2', testValue);
      await storageManager.clear();
      expect(await storageManager.get('key1')).toBeUndefined();
      expect(await storageManager.get('key2')).toBeUndefined();
    });
  });
});
