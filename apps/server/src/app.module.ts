import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { join } from "path";

import { AuthModule } from "./auth/auth.module";
import { LoggerMiddleware } from "./logger.middleware";
import { MailModule } from "./mail/mail.module";
import { AvatarModule } from "./avatar/avatar.module";
import { SystemModule } from "./system/system.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { CacheModule } from "./cache/cache.module";
import { ImapModule } from "./imap/imap.module";
import { SmtpModule } from "./smtp/smtp.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: ".env.local",
			cache: true,
			isGlobal: true
		}),
		ServeStaticModule.forRoot({
			rootPath: join(process.cwd(), "public", "scripts"),
			serveRoot: "/scripts"
		}),
		AuthModule,
		MailModule,
		AvatarModule,
		SystemModule,
		CacheModule,
		ImapModule,
		SmtpModule
	]
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).forRoutes("*");
	}
}
