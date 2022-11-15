import { LOG_DEFAULT_CONF } from '@constants/log';
import chalk, { Chalk } from 'chalk';
import { merge } from 'lodash';

import { Browser } from './browser';

type TFallback = <T = {}>(data: { fnName: string; fnMessage: string; fnData: T }) => void;

type TCustomLogFn = <T = unknown>(info: {
  tag: keyof typeof LOG_DEFAULT_CONF.TAG;
  fnName: string;
  fnMessage: string;
  fnData?: T;
}) => void;

/**
 * Simple log class for better log filter
 */
class Logger {
  name: string;
  fallback: TFallback | null;
  activated: boolean;
  config = LOG_DEFAULT_CONF;
  customRender?: TCustomLogFn;
  isBrowser = Browser.get().isBrowser();

  constructor(name: string, activated = true, config: Partial<typeof LOG_DEFAULT_CONF> = {}) {
    this.name = name;
    this.activated = activated;
    this.config = merge(this.config, config);
    this.fallback = null;
    return this;
  }

  // Set fallback when bug happen
  setBugFallback(cb: TFallback) {
    this.fallback = cb;
    return this;
  }

  // Override log function
  setCustomLogFn(fn: TCustomLogFn) {
    this.customRender = fn;
  }

  private builder(text: string, background = 'transparent', color = 'black', bold = false) {
    if (this.isBrowser) {
      return [text, `background: ${background}; color: ${color}; font-weight: ${bold ? 700 : 400}`];
    } else {
      let builder = chalk as Chalk;
      if (color !== '#000000') {
        builder = builder.hex(color);
      }
      if (background !== 'transparent') {
        builder = builder.bgHex(background);
      }
      if (bold) {
        return [builder.bold(text)];
      }
      return [builder(text)];
    }
  }

  /**
   * Print and info with custom color
   */
  print(msg: string, opts?: { background?: string; color?: string; bold?: boolean }): void {
    const built = this.builder(msg, opts?.background, opts?.color, opts?.bold);
    if (this.isBrowser) {
      console.log(`%c${built[0]}`, built[1]);
    } else {
      console.log(built[0]);
    }
  }

  private log<T = {}>(tag: keyof typeof LOG_DEFAULT_CONF.TAG, fnName: string, fnMessage: string, fnData?: T): void {
    if (this.activated) {
      const { color, label } = this.config.TAG[tag];
      if (this.customRender) {
        this.customRender<T>({ tag, fnName, fnMessage, fnData });
      } else {
        const bLabel = this.builder(` ${label} `, color, '#ffffff', true);
        const bName = this.builder(this.name, 'transparent', this.config.TARGET_COLOR, false);
        const bFnName = this.builder(fnName, 'transparent', this.config.FUNCT_COLOR, true);
        const bContext = this.builder(fnMessage, 'transparent', this.config.MESS_COLOR, false);
        if (this.isBrowser) {
          console.log(
            `<%c${bLabel[0]}%c #${bName[0]}> %c${bFnName[0]}: %c${bContext[0]}`,
            bLabel[1],
            bName[1],
            bFnName[1],
            bContext[1],
            fnData || '',
          );
        } else {
          console.log(`${bLabel[0]} #${bName[0]} > ${bFnName[0]}: ${bContext[0]}`, fnData || '');
        }
      }
    }
    if (tag === 'bug') {
      this.fallback?.({
        fnName,
        fnMessage,
        fnData,
      });
    }
  }

  /**
   * Info log, use for logging info, data and api
   */
  i<T = {}>(fnName: string, fnMessage: string, fnData?: T) {
    this.log('info', fnName, fnMessage, fnData);
    return this;
  }

  /**
   * Warning log, use for error that not affect user
   */
  w<T = {}>(fnName: string, fnMessage: string, fnData?: T) {
    this.log('warn', fnName, fnMessage, fnData);
    return this;
  }

  /**
   * Error log, use for critical log => will be tracked into server
   */
  b<T = {}>(fnName: string, fnMessage: string, fnData?: T) {
    this.log('bug', fnName, fnMessage, fnData);
    return this;
  }

  /**
   * Call when doing something before info
   */
  d<T = {}>(fnName: string, fnMessage: string, fnData?: T) {
    this.log('doin', fnName, fnMessage, fnData);
    return this;
  }
}

export { Logger };
