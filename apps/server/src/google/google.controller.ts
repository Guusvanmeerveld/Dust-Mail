import type { Request, Response } from "express";
import { join } from "path";

import { GoogleService } from "./google.service";

import {
	BadRequestException,
	Controller,
	Get,
	Query,
	Req,
	Res,
	UnauthorizedException,
	UseGuards
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import createOAuthPage from "@src/utils/createOAuthPage";

import { ThrottlerBehindProxyGuard } from "@utils/guards/throttler-proxy.guard";
import handleError from "@utils/handleError";

import { StringValidationPipe } from "@auth/pipes/string.pipe";

@Controller("google")
@ApiTags("oauth")
export class GoogleController {
	constructor(private readonly googleService: GoogleService) {}

	@Get("login")
	@UseGuards(ThrottlerBehindProxyGuard)
	public async login(
		@Req() req: Request,
		@Res() res: Response,
		@Query("code", StringValidationPipe) code: string,
		@Query("error", StringValidationPipe) error: string
	) {
		if (error) {
			throw new UnauthorizedException(`OAuth login failed: ${error}`);
		}

		if (!code) throw new BadRequestException("`code` param required");

		const redirect_uri = `${req.protocol}://${req.get("host")}${req.path}`;

		const [accessToken, refreshToken, username] = await this.googleService
			.login(code, redirect_uri)
			.catch(handleError);

		const oauthPage = await createOAuthPage(
			accessToken,
			refreshToken,
			username
		);

		res.type("text/html").send(oauthPage);
	}
}
