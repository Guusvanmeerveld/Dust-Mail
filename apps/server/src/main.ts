import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { getBasePath, getPort, getUnixSocketPath } from "./constants";
import { AppLogger } from "./utils/logger";

import { NestFactory } from "@nestjs/core";

async function bootstrap() {
	// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

	const app = await NestFactory.create(AppModule, { logger: new AppLogger() });

	const basePath = getBasePath();

	if (basePath) app.setGlobalPrefix(basePath);

	app.enableCors();

	app.use(helmet({ crossOriginOpenerPolicy: { policy: "unsafe-none" } }));

	app.use(cookieParser());

	const listenOn = getUnixSocketPath() ?? getPort();

	await app.listen(listenOn);
}

bootstrap();
