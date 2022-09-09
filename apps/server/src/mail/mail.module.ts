import { MailController } from "./mail.controller";

import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "@auth/auth.module";

@Module({
	imports: [
		ThrottlerModule.forRoot({
			ttl: 60,
			limit: 60
		}),
		AuthModule
	],
	controllers: [MailController]
})
export class MailModule {}
