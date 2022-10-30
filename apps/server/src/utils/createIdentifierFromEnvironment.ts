import os from "os";
import path from "path";

import { createHash } from "@utils/createHash";

const createIdentifierFromEnvironment = async (): Promise<string> =>
	createHash(
		path.join(
			os.hostname(),
			os.platform(),
			...os.cpus().map((cpu) => cpu.model),
			"sha256"
		)
	);

export default createIdentifierFromEnvironment;
