import { SystemController } from "./system.controller";
import { SystemService } from "./system.service";

import { Module } from "@nestjs/common";

@Module({
	providers: [SystemService],
	controllers: [SystemController]
})
export class SystemModule {}
