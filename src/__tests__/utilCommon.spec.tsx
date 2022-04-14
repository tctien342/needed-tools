import { delay, joinIntoArray } from '@utils/common';

describe('Test common utils', () => {
  test('Delay should work correctly', async () => {
    jest.setTimeout(350);
    const test = true;
    await delay(300);
    expect(test).toBeDefined();
  });

  test('Join array with symbol should work correctly', () => {
    expect(joinIntoArray([1, 2, 3], 'x')).toEqual([1, 'x', 2, 'x', 3]);
    expect(joinIntoArray([1, 3], 'x')).toEqual([1, 'x', 3]);
    expect(joinIntoArray([1], 'x')).toEqual([1]);
  });
});
