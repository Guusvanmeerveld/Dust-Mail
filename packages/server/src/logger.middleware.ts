import { Request, Response, NextFunction } from "express";

import { Injectable, Logger, NestMiddleware } from "@nestjs/common";

import { parseIpAdressFromRequest } from "./utils";

import { gray } from "kleur";
import { UAParser } from "ua-parser-js";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
	private readonly logger = new Logger(LoggerMiddleware.name);

	use(req: Request, res: Response, next: NextFunction) {
		const userAgent = new UAParser(req.headers["user-agent"]);

		const browser = userAgent.getBrowser();

		this.logger.log(
			`${req.method} ${req.baseUrl} ${
				parseIpAdressFromRequest(req) ?? "Unknown ip"
			} [${gray(`${browser.name} ${browser.version}`)}]`
		);
		next();
	}
}
