import json from "@rollup/plugin-json";

import typescript from "rollup-plugin-typescript2";

// import { OutputOptions, RollupOptions } from "rollup";

import pkg from "./package.json";

const plugins = [json(), typescript()];

const external = [
	...Object.keys(pkg.dependencies || {}),
	...Object.keys(pkg.devDependencies || {}),
	"dns/promises"
];

const entry = "src/index.ts";

const banner = `
  /**
   * @license
   * author: ${pkg.author.name}
   * ${pkg.name} v${pkg.version}
   * Released under the ${pkg.license} license.
   */
`;

const outputOptions = {
	exports: "named",
	validate: true,
	sourcemap: true,
	banner
};

const options = {
	external,
	plugins,
	input: entry
};

const config = [
	{
		...options,
		output: {
			...outputOptions,
			file: pkg.main,
			format: "cjs"
		}
	},
	{
		...options,
		output: {
			...outputOptions,
			file: pkg.module,
			format: "es"
		}
	}
];

export default config;
