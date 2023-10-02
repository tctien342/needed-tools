/// <reference types="bun-types" />
import { generateDtsBundle } from 'dts-bundle-generator';
import fs from 'fs';

import { dependencies, peerDependencies } from './package.json';
import { Logger } from './src/utils/log';

const log = new Logger('Bundler');
const start = Date.now();

log.i('JSCompiling', 'Building...');

await Bun.build({
  entrypoints: ['./src/index.tsx'],
  external: Object.keys(dependencies).concat(Object.keys(peerDependencies)),
  format: 'esm',
  minify: true,
  outdir: './build',
  sourcemap: 'external',
  target: 'browser',
});
log.i('JSCompiling', 'Done!');

log.i('TypeCompiling', 'Building...');
const typedContent = generateDtsBundle([
  {
    filePath: './src/index.tsx',
  },
]);

// Write typed content to index.d.ts
fs.writeFileSync('./build/index.d.ts', typedContent.join('\n'));
log.i('TypeCompiling', 'Done!');
log.i('Build', `Build success, take ${Date.now() - start}ms`);
