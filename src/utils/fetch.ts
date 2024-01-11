/* eslint-disable @typescript-eslint/no-explicit-any */
type RequestInitWithTimeout = RequestInit & { timeout?: number };

export class CustomFetch {
  hooks = {
    beforeCall: async (url: string, config: RequestInitWithTimeout) => {
      return { config, url };
    },
    beforeReturn: async (data: any, _config: RequestInitWithTimeout) => {
      return data;
    },
    onError: async (error: Response, _config: RequestInitWithTimeout): Promise<any> => {
      throw error;
    },
    onParse: async (res: Response): Promise<any> => {
      return res.json();
    },
  };

  overrideHooks = (hooks: Partial<typeof this.hooks>) => {
    this.hooks = { ...this.hooks, ...hooks };
  };

  setBeforeCall = (fn: typeof this.hooks.beforeCall) => {
    this.hooks.beforeCall = fn;
  };

  setBeforeReturn = (fn: typeof this.hooks.beforeReturn) => {
    this.hooks.beforeReturn = fn;
  };

  setOnError = (fn: typeof this.hooks.onError) => {
    this.hooks.onError = fn;
  };

  setOnParse = (fn: typeof this.hooks.onParse) => {
    this.hooks.onParse = fn;
  };

  async call<TResponse>(
    url: string,
    // `RequestInit` is a type for configuring
    // a `fetch` request. By default, an empty object.
    config: RequestInitWithTimeout = {},
    // Override default parse
    onParse?: (res: Response) => Promise<TResponse>,
  ): Promise<TResponse> {
    // Inside, we call the `fetch` function with
    // a URL and config given:
    const { config: newConfig, url: newUrl } = await this.hooks.beforeCall(url, config);
    // If we have a timeout, we set up a timeout:
    if (config.timeout) {
      const signal = AbortSignal.timeout(config.timeout);
      newConfig.signal = signal;
    }
    return (
      fetch(newUrl, newConfig)
        // When got a response call a `json` method on it
        .then((response) => {
          if (response.ok) {
            if (onParse) return onParse(response);
            return this.hooks.onParse(response);
          }
          throw response;
        })
        .then((data) => this.hooks.beforeReturn(data, newConfig))
        // If something went wrong, we catch an error
        // and throw it again to stop the execution.
        .catch((error) => this.hooks.onError(error as Response, newConfig))
    );
  }
}
