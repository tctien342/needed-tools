import { LOG_DEFAULT_CONF } from '@constants/log';
import chalk, { Chalk } from 'chalk';
import { merge } from 'lodash';

import { isBrowserless } from './browser';

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

  /**
   * Print with color in browser console
   */
  private browserBuilder(background = 'transparent', color = 'black', bold = false): string {
    return `background: ${background}; color: ${color}; font-weight: ${bold ? 700 : 400}`;
  }

  /**
   * Print with color in node console
   */
  private nodeBuilder(background = 'transparent', color = '#000000', bold = false, text: string): string {
    let builder = chalk as Chalk;
    if (color !== '#000000') {
      builder = builder.hex(color);
    }
    if (background !== 'transparent') {
      builder = builder.bgHex(background);
    }
    if (bold) {
      return builder.bold(text);
    }
    return builder(text);
  }

  /**
   * Print and info with custom color
   */
  print(msg: string, opts?: { background?: string; color?: string; bold?: boolean }): void {
    if (isBrowserless) {
      console.log(this.nodeBuilder(opts?.background, opts?.color, opts?.bold, msg));
    } else {
      console.log(`%c${msg}`, this.browserBuilder(opts?.background, opts?.color, opts?.bold));
    }
  }

  private log<T = {}>(tag: keyof typeof LOG_DEFAULT_CONF.TAG, fnName: string, fnMessage: string, fnData?: T): void {
    if (this.activated) {
      const { color, label } = this.config.TAG[tag];
      if (this.customRender) {
        this.customRender<T>({ tag, fnName, fnMessage, fnData });
      } else {
        if (isBrowserless) {
          const bLabel = this.nodeBuilder(color, '#ffffff', true, ` ${label} `);
          const bName = this.nodeBuilder('transparent', this.config.TARGET_COLOR, false, this.name);
          const bFnName = this.nodeBuilder('transparent', this.config.FUNCT_COLOR, true, fnName);
          const bContext = this.nodeBuilder('transparent', this.config.MESS_COLOR, false, fnMessage);
          console.log(`${bLabel} #${bName} > ${bFnName}: ${bContext}`, fnData || '');
        } else {
          console.log(
            `<%c${label}%c #${this.name}> %c${fnName}: %c${fnMessage}`,
            this.browserBuilder(color, 'white', true),
            this.browserBuilder('transparent', this.config.TARGET_COLOR, false),
            this.browserBuilder('transparent', this.config.FUNCT_COLOR, true),
            this.browserBuilder('transparent', this.config.MESS_COLOR),
            fnData || '',
          );
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
