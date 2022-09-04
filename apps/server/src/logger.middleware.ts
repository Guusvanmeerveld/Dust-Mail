import { Request, Response, NextFunction } from "express";
import { gray } from "kleur";
import { UAParser } from "ua-parser-js";

import { parseIpAdressFromRequest } from "./utils";

import { Injectable, Logger, NestMiddleware } from "@nestjs/common";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
	private readonly logger = new Logger(LoggerMiddleware.name);

	use(req: Request, _: Response, next: NextFunction) {
		const userAgent = new UAParser(req.headers["user-agent"]);

		const browser = userAgent.getBrowser();

		this.logger.log(
			`${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl} ${
				parseIpAdressFromRequest(req) ?? "Unknown ip"
			} [${gray(`${browser.name} ${browser.version}`)}]`
		);

		next();
	}
}
