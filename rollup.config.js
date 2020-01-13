import typescript from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  input: './src/e7ipc-electron.ts',
  output: {
    file: './lib/e7ipc-electron.js',
    format: 'cjs',
    sourcemap: true,
    sourcemapExcludeSources: true,
  },
  external: ['electron'],

  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      tsconfigOverride: {
        compilerOptions: {
          module: 'es2015',
          sourceMap: true,
          declaration: false,
        },
      },
    }),
  ],
}
