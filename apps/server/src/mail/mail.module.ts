import { Module } from "@nestjs/common";

import { AuthModule } from "@auth/auth.module";

import { MailController } from "./mail.controller";
import { ThrottlerModule } from "@nestjs/throttler";

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
