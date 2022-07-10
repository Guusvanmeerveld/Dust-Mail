import { Injectable } from "@nestjs/common";
import { readJson } from "fs-extra";
import { join } from "path";

@Injectable()
export class SystemService {
	async getVersion(): Promise<string> {
		const packageInfoPath = join(process.cwd(), "package.json");

		const data: { version: string } = await readJson(packageInfoPath);

		return data.version;
	}
}
