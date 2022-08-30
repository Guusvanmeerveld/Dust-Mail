import { Module } from "@nestjs/common";

import { CacheModule } from "@src/cache/cache.module";

import { SmtpService } from "./smtp.service";

@Module({
	imports: [CacheModule],
	providers: [SmtpService],
	exports: [SmtpService]
})
export class SmtpModule {}
