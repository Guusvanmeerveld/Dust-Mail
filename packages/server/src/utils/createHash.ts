import { createHash as hash } from "crypto";

export const createHash = (from: string, algorithm = "md5"): string => {
	return hash(algorithm).update(from, "utf-8").digest("hex");
};
