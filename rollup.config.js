import ts from "typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";

export default {
  context: "window",
  input: "src/index.ts",
  output: {
    dir: "lib",
    format: "esm",
  },
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs({
      include: /node_modules/,
    }),
    json(),
    typescript({
      typescript: ts,
    }),
    terser({
      output: {
        comments: false,
      },
    }),
  ],
};
