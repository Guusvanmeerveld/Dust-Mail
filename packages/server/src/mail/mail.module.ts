import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { MailController } from "./mail.controller";

@Module({
	imports: [AuthModule],
	controllers: [MailController]
})
export class MailModule {}
