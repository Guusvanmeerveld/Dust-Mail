import { join } from "path";

export const getCertsDir = () =>
	process.env.CERTS_DIR ?? join(process.cwd(), "certs");
