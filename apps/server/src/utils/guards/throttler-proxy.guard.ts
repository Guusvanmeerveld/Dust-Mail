import { Request } from "express";

import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

import { parseIpAdressFromRequest } from "@src/utils";

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
	protected getTracker(req: Request): string {
		return parseIpAdressFromRequest(req);
	}
}
