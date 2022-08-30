import { RollupOptions } from "rollup";

import typescript from "rollup-plugin-typescript2";
import ts from "rollup-plugin-ts";

import pkg from "./package.json";

const options: RollupOptions = {
	external: [],
	plugins: [typescript({ useTsconfigDeclarationDir: true })],
	input: "src/index.ts"
};

const config: RollupOptions[] = [
	{
		output: {
			file: "dist/index.d.ts"
		},
		input: "src/index.ts",
		plugins: [ts()]
	},
	{
		...options,
		output: {
			file: pkg.main,
			format: "cjs"
		}
	},
	{
		...options,
		output: {
			file: pkg.module,
			format: "es"
		}
	}
];

export default config;
