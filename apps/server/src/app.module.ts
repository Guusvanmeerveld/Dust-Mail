import { AuthModule } from "./auth/auth.module";
import { AvatarModule } from "./avatar/avatar.module";
import { CacheModule } from "./cache/cache.module";
import { CryptoModule } from "./crypto/crypto.module";
import { ImapModule } from "./imap/imap.module";
import { LoggerMiddleware } from "./logger.middleware";
import { MailModule } from "./mail/mail.module";
import { SmtpModule } from "./smtp/smtp.module";
import { SystemModule } from "./system/system.module";

import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: ".env.local",
			cache: true,
			isGlobal: true
		}),
		AuthModule,
		MailModule,
		AvatarModule,
		SystemModule,
		CacheModule,
		ImapModule,
		SmtpModule,
		CryptoModule
	]
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).forRoutes("*");
	}
}
