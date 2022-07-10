import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthModule } from "./auth/auth.module";
import { LoggerMiddleware } from "./logger.middleware";
import { MailModule } from "./mail/mail.module";
import { AvatarModule } from "./avatar/avatar.module";
import { SystemModule } from "./system/system.module";

@Module({
	imports: [
		ConfigModule.forRoot({ cache: true, isGlobal: true }),
		AuthModule,
		MailModule,
		AvatarModule,
		SystemModule
	]
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).forRoutes("*");
	}
}
