import { Request } from "express";

import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

import { bearerPrefix } from "@src/constants";
import { parseIpAdressFromRequest } from "@src/utils";

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
	protected getTracker(req: Request): string {
		const authHeader = req.get("Authorization");

		if (authHeader) {
			const token = authHeader.slice(bearerPrefix.length);

			if (token) {
				return token;
			}
		}

		return parseIpAdressFromRequest(req);
	}
}
