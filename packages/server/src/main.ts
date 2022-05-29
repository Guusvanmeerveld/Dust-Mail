import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

import { AppLogger } from "./utils/logger";

import { port } from "./constants";

async function bootstrap() {
	// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

	const app = await NestFactory.create(AppModule, { logger: new AppLogger() });

	await app.listen(port);
}

bootstrap();
