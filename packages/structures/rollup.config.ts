import { RollupOptions } from "rollup";

import ts from "rollup-plugin-ts";
import typescript from "rollup-plugin-typescript2";

import pkg from "./package.json";

const options: RollupOptions = {
	external: ["zod"],
	plugins: [typescript({ useTsconfigDeclarationDir: true })],
	input: "src/lib.ts"
};

const config: RollupOptions[] = [
	{
		output: {
			file: pkg.types
		},
		input: "src/lib.ts",
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
