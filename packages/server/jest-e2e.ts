import tsconfig from "./tsconfig.json";
import tsconfigPaths from "tsconfig-paths-jest";

export default {
	moduleFileExtensions: ["js", "json", "ts"],
	moduleNameMapper: tsconfigPaths(tsconfig),
	rootDir: "./src",
	testEnvironment: "node",
	testRegex: ".e2e-spec.ts$",
	transform: {
		"^.+\\.(t|j)s$": "ts-jest"
	}
};
