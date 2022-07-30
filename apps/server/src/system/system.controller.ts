import { Controller, Get } from "@nestjs/common";
import { SystemService } from "./system.service";

@Controller("system")
export class SystemController {
	constructor(private systemService: SystemService) {}

	@Get("version")
	async getVersion() {
		const version = await this.systemService.getVersion();

		return {
			type: process.env.UNSTABLE != undefined ? "git" : "stable",
			version
		};
	}
}
