import { deepMerge, delay, joinIntoArray, whetherArray } from '@utils/common';

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
  test('DeepMerge should work correctly', () => {
    const target = {
      a: 1,
      b: 2,
      c: {
        d: 3,
        e: 4,
      },
    };
    const source = {
      a: 2,
      c: {
        d: 4,
      },
    };
    const result = {
      a: 2,
      b: 2,
      c: {
        d: 4,
        e: 4,
      },
    };
    expect(deepMerge(target, source)).toEqual(result);
  });
});
