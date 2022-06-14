import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { MailController } from "./mail.controller";
import { MailService } from "./mail.service";

@Module({
	imports: [AuthModule],
	controllers: [MailController],
	providers: [MailService]
})
export class MailModule {}
