import type { Request, Response } from "express";
import { join } from "path";

import { GoogleService } from "./google.service";

import { LoginResponse } from "@dust-mail/typings";

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

import createTokenResponse from "@utils/createTokenResponse";
import { ThrottlerBehindProxyGuard } from "@utils/guards/throttler-proxy.guard";
import handleError from "@utils/handleError";

import { StringValidationPipe } from "@auth/pipes/string.pipe";

@Controller("google")
export class GoogleController {
	constructor(private readonly googleService: GoogleService) {}

	private readonly pathToOAuthPage = join(
		process.cwd(),
		"public",
		"oauth.html"
	);

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

		const tokens: LoginResponse = [
			createTokenResponse("access", accessToken),
			createTokenResponse("refresh", refreshToken)
		];

		const cookieOptions = { secure: true, httpOnly: true };

		res.cookie("tokens", tokens, cookieOptions);

		res.cookie("username", username, cookieOptions);

		res.sendFile(this.pathToOAuthPage);
	}
}
