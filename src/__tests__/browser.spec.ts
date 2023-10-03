import { Browser } from '@utils/browser';
import { JSDOM } from 'jsdom';

describe('Browser', () => {
  const instance = Browser.get();
  const dom = new JSDOM('<!DOCTYPE html>');

  beforeAll(() => {
    (global as any).window = dom.window;
    (window as any).matchMedia = () => ({ matches: false });
    (global as any).matchMedia = window.matchMedia;
  });

  afterAll(() => {
    delete (global as any).window;
    delete (global as any).matchMedia;
  });

  it('should return the same instance when calling get()', () => {
    const instance1 = Browser.get();
    expect(instance).toBe(instance1);
  });

  it('should return true when calling isChrome() on Chrome', () => {
    Object.defineProperty(window, 'chrome', {
      value: {
        runtime: true,
        webstore: true,
      },
    });
    expect(instance.isChrome()).toBe(true);
  });

  it('should return true when calling isBlink() on Chrome', () => {
    Object.defineProperty(window, 'CSS', { value: true });
    expect(instance.isBlink()).toBe(true);
  });

  it('should return true when calling isDarkMode() on a dark mode device', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: () => ({ matches: true }),
    });
    expect(instance.isDarkMode()).toBe(true);
  });

  it('should return true when calling isFirefox() on Firefox', () => {
    (global as any).InstallTrigger = true;
    expect(instance.isFirefox()).toBe(true);
    delete (global as any).InstallTrigger;
  });

  it('should return true when calling isMobile() on a mobile device', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        userAgent:
          'Mozilla/5.0 (Linux; Android 11; SM-G975U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Mobile Safari/537.36',
      },
    });
    expect(instance.isMobile()).toBe(true);
  });

  it('should return true when calling isOpera() on Opera', () => {
    Object.defineProperty(window, 'opr', { value: { addons: true } });
    (global as any).opr = (window as any).opr;
    expect(instance.isOpera()).toBe(true);
  });

  it('should return true when calling isSafari() on Safari', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36',
    });
    expect(instance.isSafari()).toBe(true);
  });

  it('should return true when calling isTouchScreen() on a touch screen device', () => {
    expect(instance.isTouchScreen()).toBe(true);
  });
});
