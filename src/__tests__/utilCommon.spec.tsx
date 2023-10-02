import { delay, joinIntoArray, whetherArray } from '@utils/common';

describe('Test common utils', () => {
  test('Delay should work correctly', async () => {
    const test = true;
    await delay(300);
    expect(test).toBeDefined();
  });

  test('Join array with symbol should work correctly', () => {
    expect(joinIntoArray([1, 2, 3], 'x')).toEqual([1, 'x', 2, 'x', 3]);
    expect(joinIntoArray([1, 3], 'x')).toEqual([1, 'x', 3]);
    expect(joinIntoArray([1], 'x')).toEqual([1]);
  });
  test('Wheather array should work correctly', () => {
    expect(whetherArray([1])).toEqual([1]);
    expect(whetherArray(1)).toEqual([1]);
  });
});
