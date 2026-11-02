import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
    input: "tests/harness/preview.mjs",
    output: { file: "tests/harness/out/preview.js", format: "iife", intro: 'var process = { env: { NODE_ENV: "production" } };' },
    plugins: [resolve({ browser: true }), commonjs()]
};
