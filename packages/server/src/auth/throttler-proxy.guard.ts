import { Injectable } from "@nestjs/common";

import { ThrottlerGuard } from "@nestjs/throttler";

import { Request } from "express";

import { parseIpAdressFromRequest } from "@src/utils";

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
	protected getTracker(req: Request): string {
		return parseIpAdressFromRequest(req);
	}
}
