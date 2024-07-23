import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default {
    input: {
        index: 'index.js',
        runner: 'src/runner.js'
    },
    output: [
        {
            dir: 'dist/es',
            format: 'es',
            sourcemap: false,
        },
        {
            dir: 'dist/cjs',
            format: 'cjs'
        }
    ],
    plugins: [
        resolve(),
        commonjs(),
        json(),
        terser()
    ],
    external: ['child_process', 'path', 'url', 'events', 'buffer', 'string_decoder'],
}