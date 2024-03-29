/* eslint-disable @typescript-eslint/no-explicit-any */
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

const deepMerge = <T = unknown, S = unknown>(target: T, source: S): S & T => {
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!(target as any)[key]) Object.assign(target as any, { [key]: {} });
        deepMerge((target as any)[key], source[key]);
      } else {
        Object.assign(target as any, { [key]: source[key] });
      }
    }
  }

  return target as any;
};

const deepClone = <T = unknown>(item: T): T => {
  if (!item) {
    return item;
  }
  let result: any;
  if (Array.isArray(item)) {
    result = [];
    for (const i in item) {
      result[i] = deepClone(item[i]);
    }
  } else if (typeof item === 'object') {
    result = {};
    for (const i in item) {
      result[i] = deepClone(item[i]);
    }
  } else {
    result = item;
  }
  return result;
};

function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export { deepClone, deepMerge, delay, joinIntoArray, whetherArray };
