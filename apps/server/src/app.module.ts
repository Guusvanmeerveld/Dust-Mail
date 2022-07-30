import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthModule } from "./auth/auth.module";
import { LoggerMiddleware } from "./logger.middleware";
import { MailModule } from "./mail/mail.module";
import { AvatarModule } from "./avatar/avatar.module";
import { SystemModule } from "./system/system.module";
import { join } from "path";
import { ServeStaticModule } from "@nestjs/serve-static";

@Module({
	imports: [
		ConfigModule.forRoot({ cache: true, isGlobal: true }),
		ServeStaticModule.forRoot({
			rootPath: join(process.cwd(), "public", "scripts"),
			serveRoot: "/scripts"
		}),
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
