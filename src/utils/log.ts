import { LOG_DEFAULT_CONF } from '@constants/log';
import { merge } from 'lodash';

type TFallback = <T = {}>(data: { fnName: string; fnMessage: string; fnData: T }) => void;

/**
 * Simple log class for better log filter
 */
class Logger {
  name: string;
  fallback: TFallback | null;
  activated: boolean;
  config = LOG_DEFAULT_CONF;

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

  /**
   * Print with color in console
   */
  private builder(background = 'transparent', color = 'black', bold = false): string {
    return `background: ${background}; color: ${color}; font-weight: ${bold ? 700 : 400}`;
  }

  /**
   * Print and info with custom color
   */
  print(msg: string, opts?: { background: string; color: string; bold: boolean }): void {
    console.log(`%c${msg}`, this.builder(opts?.background, opts?.color, opts?.bold));
  }

  private log<T = {}>(tag: keyof typeof LOG_DEFAULT_CONF.TAG, fnName: string, fnMessage: string, fnData?: T): void {
    if (this.activated) {
      const { color, label } = this.config.TAG[tag];
      console.log(
        `<%c${label}%c #${this.name}> %c${fnName}: %c${fnMessage}`,
        this.builder(color, 'white', true),
        this.builder('transparent', this.config.TARGET_COLOR, false),
        this.builder('transparent', this.config.FUNCT_COLOR, true),
        this.builder('transparent', this.config.MESS_COLOR),
        fnData || '',
      );
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
