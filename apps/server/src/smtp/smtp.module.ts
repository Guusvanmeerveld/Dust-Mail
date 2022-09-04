import { SmtpService } from "./smtp.service";

import { Module } from "@nestjs/common";

import { CacheModule } from "@src/cache/cache.module";

@Module({
	imports: [CacheModule],
	providers: [SmtpService],
	exports: [SmtpService]
})
export class SmtpModule {}
