import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/create-tql-app.js",
  output: {
    dir: "lib",
    format: "cjs",
  },
  plugins: [
    resolve({
      browser: true,
      node: true,
    }),
    commonjs({
      include: /node_modules/,
    }),
    json(),
    babel({ babelHelpers: "bundled" }),
    terser({
      output: {
        comments: false,
      },
    }),
  ],
};
