import json from "@rollup/plugin-json";

import typescript from "rollup-plugin-typescript2";

import { OutputOptions, RollupOptions } from "rollup";

// import { OutputOptions, RollupOptions } from "rollup";

import pkg from "./package.json";

const outputOptions: OutputOptions = {
	exports: "named",
	validate: true,
	sourcemap: true,
	banner: `
  /**
   * @license
   * author: ${pkg.author.name}
   * ${pkg.name} v${pkg.version}
   * Released under the ${pkg.license} license.
   */
`
};

const options: RollupOptions = {
	external: [
		...Object.keys(pkg.dependencies || {}),
		...Object.keys(pkg.devDependencies || {})
	],
	plugins: [json(), typescript({ useTsconfigDeclarationDir: true })],
	input: "src/index.ts"
};

const config: RollupOptions[] = [
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
