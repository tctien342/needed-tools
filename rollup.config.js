import commonjs from 'rollup-plugin-commonjs';
import del from 'rollup-plugin-delete';
import resolve from 'rollup-plugin-node-resolve';
import external from 'rollup-plugin-peer-deps-external';
import progress from 'rollup-plugin-progress';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

import pkg from './package.json';

export default [
  {
    input: 'src/index.tsx',
    output: [
      {
        exports: 'named',
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        exports: 'named',
        file: pkg.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      del({ targets: 'build/*' }),
      external(),
      resolve(),
      typescript({
        clean: true,
        exclude: ['**/__tests__/**', '__Template'],
        rollupCommonJSResolveHack: true,
        tsconfigDefaults: {
          compilerOptions: {
            plugins: [
              { transform: 'typescript-transform-paths' },
              { afterDeclarations: true, transform: 'typescript-transform-paths' },
            ],
          },
        },
        typescript: require('ttypescript'),
      }),
      commonjs({
        include: ['node_modules/**'],
      }),
      terser({
        mangle: {
          eval: true,
          toplevel: true,
        },
        output: {
          comments: 'some',
        },
      }),
      progress(),
    ],
  },
];
