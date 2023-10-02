/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * This file include detection for all popular browser
 */

declare let opr: any;
declare let InstallTrigger: any;

class Browser {
  static instance: Browser;
  private constructor() {
    return;
  }

  static get() {
    if (!this.instance) {
      this.instance = new Browser();
    }
    return this.instance;
  }

  execute(cb: () => boolean) {
    if (typeof (window as any) !== 'undefined' && typeof (matchMedia as any) === 'function') {
      return cb();
    }
    return false;
  }

  isBlink() {
    return this.execute(() => (isChrome || isOpera) && !!(window as any).CSS);
  }

  isBrowser() {
    return this.execute(() => true);
  }

  isChrome() {
    return this.execute(
      () => !!(window as any).chrome && (!!(window as any).chrome.webstore || !!(window as any).chrome.runtime),
    );
  }

  isDarkMode() {
    return this.execute(() => matchMedia?.('(prefers-color-scheme: dark)').matches);
  }

  isEdge() {
    return this.execute(() => !isIE && !!(window as any).StyleMedia);
  }

  isFirefox() {
    return this.execute(() => typeof InstallTrigger !== 'undefined');
  }

  isIE() {
    return this.execute(() => false || !!(document as any).documentMode);
  }

  isMobile() {
    return this.execute(() => {
      if (globalThis.navigator) {
        const ua = globalThis.navigator.userAgent;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase());
      }
      return false;
    });
  }

  isOpera() {
    return this.execute(
      () =>
        (!!(window as any).opr && !!opr.addons) || !!(window as any).opera || navigator.userAgent.indexOf(' opr/') >= 0,
    );
  }

  isSafari() {
    return this.execute(() => /^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }

  isTouchScreen() {
    return this.execute(() => matchMedia?.('(hover: none), (pointer: coarse)').matches);
  }
}

const instance = Browser.get();
const isOpera = instance.isOpera();
const isSafari = instance.isSafari();
const isChrome = instance.isChrome();
const isIE = instance.isIE();
const isFirefox = instance.isFirefox();
const isEdge = instance.isEdge();
const isBlink = instance.isBlink();
const isMobile = instance.isMobile();
const isTouchScreen = instance.isTouchScreen();
const isDarkMode = instance.isDarkMode();

export { Browser, isBlink, isChrome, isDarkMode, isEdge, isFirefox, isIE, isMobile, isOpera, isSafari, isTouchScreen };
