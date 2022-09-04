import { SystemService } from "./system.service";

import { Controller, Get } from "@nestjs/common";

@Controller("system")
export class SystemController {
	constructor(private systemService: SystemService) {}

	@Get("version")
	async getVersion() {
		const version = await this.systemService.getVersion();

		return {
			type: process.env.UNSTABLE === "true" ? "git" : "stable",
			version
		};
	}
}
