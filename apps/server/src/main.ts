import cookieParser from "cookie-parser";
import { readJSON } from "fs-extra";
import helmet from "helmet";
import { join } from "path";

import { AppModule } from "./app.module";
import { getBasePath, getPort, getUnixSocketPath } from "./constants";
import { AppLogger } from "./utils/logger";

import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
	// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

	const app = await NestFactory.create(AppModule, { logger: new AppLogger() });

	const basePath = getBasePath();

	if (basePath) app.setGlobalPrefix(basePath);

	app.enableCors();

	app.use(
		helmet({
			crossOriginOpenerPolicy: { policy: "unsafe-none" }
		})
	);

	app.use(cookieParser());

	const listenOn = getUnixSocketPath() ?? getPort();

	const pkg = await readJSON(join(process.cwd(), "package.json"));

	const config = new DocumentBuilder()
		.setTitle("Dust-Mail")
		.setDescription("The Dust-Mail API specification")
		.setVersion(pkg.version)
		.addBearerAuth()
		.addTag("auth")
		.addTag("mail")
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("openapi", app, document);

	await app.listen(listenOn);
}

bootstrap();
