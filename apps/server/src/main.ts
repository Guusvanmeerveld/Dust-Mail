import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { port } from "./constants";
import { AppLogger } from "./utils/logger";

async function bootstrap() {
	// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

	const app = await NestFactory.create(AppModule, { logger: new AppLogger() });

	if (process.env.BASE_PATH) app.setGlobalPrefix(process.env.BASE_PATH);

	app.enableCors();

	app.use(helmet({ crossOriginOpenerPolicy: { policy: "unsafe-none" } }));

	app.use(cookieParser());

	await app.listen(port);
}

bootstrap();
