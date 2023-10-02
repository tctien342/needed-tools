# JS Needed tools

> Collection of saintno's useful tools

### Install this into your project

- Run in cmd:

```bash
yarn add @saintno/needed-tools lodash
```

### Methods and Classes

#### Browser

Return set of Browser's feature

```ts
import { Browser } from "@saintno/needed-tools";
// Detect browser
Browser.isOpera: boolean;
Browser.isSafari: boolean;
Browser.isChrome: boolean;
Browser.isIE: boolean;
Browser.isFirefox: boolean;
Browser.isEdge: boolean;
Browser.isBlink: boolean;
// Detect features
Browser.isMobile: boolean; // Return `true` if current browser is in mobile
Browser.isTouchScreen: boolean; // Return `true` if current browser's screen have touch
Browser.isDarkMode: boolean; // Return `true` if current browser is in darkmode
```

#### CommonRegex

Return some useful regex

```ts
import { CommonRegex } from "@saintno/needed-tools";
CommonRegex.hex = /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i,
CommonRegex.number = /^-?\d*\.?\d*$/,
CommonRegex.phone = /^\+?[\d\s]{8,}$/,
CommonRegex.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
```

#### Logger

Useful class to log info in console

```ts
import { Logger } from '@saintno/needed-tools';
// Logger need `name` of object that log belongs to
// Logger(object_name, activated?, config_override?)
const MainScreenLogger = new Logger('MainScreen');
// For type of loging:
// i: Info: For some output of function or data's contents
// w: Warning: Something wrong happen but your app still work as normal
// b: Bug: Critical error happen and will stop your app
// d: Doing: Log about running job, background services
// Log functions need 3 params: fnName, fnMessage, fnData
MainScreenLogger.i('useEffect', 'Hello from useEffect'); // Without data
MainScreenLogger.i('useEffect', 'Hello from useEffect with data', { name: 'Kiss me' }); // With data
MainScreenLogger.w('useEffect', 'Prefetch cache failed', e);
MainScreenLogger.b('useEffect', 'Cant detect screens size', e);
MainScreenLogger.d('Web3Provider', 'Getting list of address');

// Generate own customize log
// print(msg: string, opts?: { background: string; color: string; bold: boolean }): void
MainScreenLogger.print("Hello World!", { background: "#ffffff"; color: "ff00ff"; bold: true });

// Bug fallback, in case when bug happen, bind your fallback to tracking bug or alert it to user
MainScreenLogger.setBugFallback(({fnName, fnMessage, fnData}) => {
    // Do some bug tracking or alert
});
```

#### QueueManager

Make an queue into your code, init an queue and pushing job into it, the queue will do the job in queue each time you call `add`, all the job in queue will be trigger parralel with max worker by `max_job`

```ts
import { QueueManager } from '@saintno/needed-tools';
// QueueManager(name_of_queue, max_job = 4, log = true)
const MainQueue = new QueueManager('MainQueue');
// Push an job into queue without wait
MainQueue.add(() => {
  console.log('Hello world!');
});
// With high priority, this job will be place in top of queue
MainQueue.add(() => {
  console.log('Hello world!');
}, true);
// Push and wait with high priority
await MainQueue.wait(() => {
  console.log('Hello world!');
}, true);
```

#### CacheManager

Caching everything in IndexDB with `CacheManager`

```ts
import { CacheManager } from '@saintno/needed-tools';
// CacheManager(store_name_of_cache, activated = true, log = true)
const MainCache = new CacheManager('MainCache');

// Set some cache with `set`
MainCache.set({
  key: 'DATA_2022',
  data: [{ name: '1' }, { name: '2' }],
  tl: CacheManager.TIME['5min'], // Caching in 5min
  tags: ['DATA'], // Will be auto matic detele if call clean by tag
});

// Get some cache with `get` and fallback into generator
const data = await MainCache.get({
  key: 'DATA_2022',
  tl: CacheManager.TIME['5min'], // Caching in 5min
  tags: ['DATA_2'], // Will be auto matic detele if call clean by tag
  generator: async () => [{ name: '1' }, { name: '2' }], // If cache not found => call generator => set new cache => return data from generator
});

// Clear all cache with tag
MainCache.clearByTag('DATA');
MainCache.clearByTags(['DATA', 'DATA_2']); // Multiple tags

// Clear all cache in store
MainCache.clear();
```

#### APIQueueItem

Call api much more easier with Cache and Queue

```ts
import { APIQueueItem } from '@saintno/needed-tools';
// Support 5 methods: GET, POST, PUT, DELETE, PATCH
// Only GET method support caching, set cache on other method will not works
const data = new APIQueueItem('https://google.com.vn').get(); // Default without cache and placing bottom of queue
const data = new APIQueueItem('https://google.com.vn').high().get(); // Calling without cache and high priority

// Setting cache, without queue, type binding
const data = new APIQueueItem('https://google.com.vn')
  .cache({
    tl: '5min', // Caching time
    tags: ['DATA'], // Tag of this cache on CacheManager
    deps: ['DATA_1'], // Auto clear other tags when call this
  })
  .now() // Bypass queue, call directly into fetch
  .get<IAppData>();

// Post method, high priority
new APIQueueItem(`https://google.com.vn/${id}`).high().post({ name: 'SaintNo' });

// Default APIQueueItem will use fetch instance, if you want customize that instance, create an fetch instance by your self then bind it:
const fetchInstance = fetch.create(); // Create your instance
APIQueueItem.setApiInstance(fetchInstance); // Bind it
```

#### Other `Tools`

Some tools that may useful

```ts
import { Tools } from '@saintno/needed-tools';

// Delay function for fake api, fake loading...
await Tools.delay(3000); // Delay 3s

// Get current mouse position
Tools.getMousePosition(); // Return {x: number, y: number} in screen

// Get element offset position in parent element
Tools.getWindowRelativeOffset(parent_ele, child_ele);
// This will return offset object
const offset = {
  left: 0, // Pixel offset from parent left
  top: 0,
  right: 0,
  bottom: 0,
};
```

### Technologies

- Typescript
- Jest
- Rollup

### Maintainer

@tctien342
