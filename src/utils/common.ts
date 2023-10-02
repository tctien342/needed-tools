/**
 * Join an item into array like
 *
 * ```js
 * joinIntoArray([1,2,3], "x") => [1,"x",2,"x",3]
 * ```
 * @param arr Array need to be joined
 * @param value Item will be join into array
 */
const joinIntoArray = <T = unknown, B = unknown>(arr: T[], value: B): (B | T)[] => {
  return arr.reduce(
    (result, element, index, array) => {
      result.push(element);
      if (index < array.length - 1) {
        result.push(value);
      }
      return result;
    },
    [] as (B | T)[],
  );
};

/**
 * Delay current function by given time
 * @param {number} ms Time delayed
 */
const delay = (ms: number): Promise<boolean> => {
  return new Promise((rs) => {
    setTimeout(() => {
      rs(true);
    }, ms);
  });
};

/**
 * Check if item is array or not, if not create an array with itself
 * @param {object | string} item Item need to return array
 */
const whetherArray = <T = unknown>(item?: T | T[]): T[] => {
  if (Array.isArray(item)) {
    return item;
  }
  const result = item ? [item] : [];
  return result;
};

export { delay, joinIntoArray, whetherArray };
