import { APIQueueItem } from '@utils/api';
import * as Browser from '@utils/browser';
import { CacheManager } from '@utils/cache';
import { deepMerge, delay } from '@utils/common';
import { getWindowRelativeOffset } from '@utils/element';
import { CustomFetch } from '@utils/fetch';
import { Logger } from '@utils/log';
import { MousePos, getMousePosition } from '@utils/mouse';
import { QueueManager } from '@utils/queue';
import { CommonRegex } from '@utils/regex';
import { StorageManager } from '@utils/storage';

const Tools = {
  deepMerge,
  delay,
  getMousePosition,
  getWindowRelativeOffset,
};

/**
 * Export Utils
 */
export {
  APIQueueItem,
  Browser,
  CacheManager,
  CommonRegex,
  CustomFetch,
  Logger,
  MousePos,
  QueueManager,
  StorageManager,
  Tools,
};
