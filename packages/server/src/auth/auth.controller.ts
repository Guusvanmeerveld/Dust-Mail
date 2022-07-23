import { join } from "path";

import mailDiscover from "mail-discover";

import { Request as ExpressRequest, Response } from "express";
import axios from "axios";

import { JwtService } from "@nestjs/jwt";

import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Post,
	Query,
	Req,
	Res,
	UnauthorizedException,
	UseGuards
} from "@nestjs/common";

import { allowedDomains } from "./constants";

import { ThrottlerBehindProxyGuard } from "@utils/guards/throttler-proxy.guard";

import handleError from "@utils/handleError";

import exchangeGoogleToken from "@mail/google/exchangeToken";
import { clientInfo as googleClientInfo } from "@mail/google/constants";

import UserError from "@utils/interfaces/error.interface";

import { Request } from "./interfaces/request.interface";
import { RefreshTokenPayload } from "./interfaces/payload.interface";
import { SecurityType } from "./interfaces/config.interface";

import { StringValidationPipe } from "./pipes/string.pipe";

import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
	private allowedDomains?: string[];

	constructor(
		private authService: AuthService,
		private jwtService: JwtService
	) {
		if (allowedDomains) this.allowedDomains = allowedDomains.split(",");
	}

	@Post("login")
	@UseGuards(ThrottlerBehindProxyGuard)
	public async login(
		@Body("incoming_username", StringValidationPipe)
		incomingUsername?: string,
		@Body("incoming_password", StringValidationPipe)
		incomingPassword?: string,
		@Body("incoming_server", StringValidationPipe)
		incomingServer?: string,
		@Body("incoming_port")
		incomingPort?: number,
		@Body("incoming_security", StringValidationPipe)
		incomingSecurity?: SecurityType,
		@Body("outgoing_username", StringValidationPipe)
		outgoingUsername?: string,
		@Body("outgoing_password", StringValidationPipe)
		outgoingPassword?: string,
		@Body("outgoing_server", StringValidationPipe)
		outgoingServer?: string,
		@Body("outgoing_port")
		outgoingPort?: number,
		@Body("outgoing_security", StringValidationPipe)
		outgoingSecurity?: SecurityType
	) {
		if (incomingUsername && incomingPassword) {
			if (!incomingServer || !outgoingServer) {
				const result = await mailDiscover(incomingUsername).catch(
					(e: Error) => {
						if (!incomingServer) {
							throw new BadRequestException({
								code: UserError.Misc,
								message: e.message
							});
						}
					}
				);

				if (result) {
					const [foundIncomingServer, foundOutgoingServer] = result;

					if (!incomingServer) {
						incomingServer = foundIncomingServer.server;
						incomingPort = foundIncomingServer.port;
						incomingSecurity = foundIncomingServer.security;
					}

					if (!outgoingServer) {
						outgoingServer = foundOutgoingServer.server;
						outgoingPort = foundOutgoingServer.port;
						outgoingSecurity = foundOutgoingServer.security;
					}
				}
			}

			if (
				this.allowedDomains &&
				((incomingServer && !this.allowedDomains.includes(incomingServer)) ||
					(outgoingServer && !this.allowedDomains.includes(outgoingServer)))
			) {
				throw new BadRequestException({
					code: UserError.Misc,
					message: "Mail server is not on whitelist"
				});
			}

			if (!incomingSecurity) incomingSecurity = "NONE";
			if (!incomingPort) {
				if (incomingSecurity == "TLS" || incomingSecurity == "STARTTLS")
					incomingPort = 993;
				if (incomingSecurity == "NONE") incomingPort = 143;
			}

			if (!outgoingSecurity) outgoingSecurity = "NONE";
			if (!outgoingPort) {
				if (outgoingSecurity == "TLS") outgoingPort = 465;
				if (outgoingSecurity == "STARTTLS") outgoingPort = 587;
				if (outgoingSecurity == "NONE") outgoingPort = 25;
			}

			if (!outgoingUsername) outgoingUsername = incomingUsername;
			if (!outgoingPassword) outgoingPassword = outgoingPassword;

			return await this.authService
				.login({
					incoming: {
						mail: {
							username: incomingUsername,
							password: incomingPassword,
							server: incomingServer,
							port: incomingPort,
							security: incomingSecurity
						}
					},
					outgoing: {
						mail: {
							username: outgoingUsername,
							password: outgoingPassword,
							server: outgoingServer,
							port: outgoingPort,
							security: outgoingSecurity
						}
					}
				})
				.catch(handleError);
		}

		throw new BadRequestException("Missing fields");
	}

	private bearerPrefix = "Bearer ";

	@Get("refresh")
	public async refreshTokens(
		@Req()
		req: ExpressRequest
	) {
		const authHeader = req.headers.authorization;

		if (!authHeader.startsWith(this.bearerPrefix))
			throw new BadRequestException("Auth token should be of type bearer");

		const userRefreshToken = authHeader?.slice(
			this.bearerPrefix.length,
			authHeader?.length
		);

		const refreshTokenPayload: RefreshTokenPayload = await this.jwtService
			.verifyAsync(userRefreshToken)
			.catch(() => {
				throw new UnauthorizedException("Refresh token is invalid");
			});

		if (!refreshTokenPayload.accessToken)
			throw new UnauthorizedException(
				"Can't use access token as refresh token"
			);

		return await this.jwtService
			.verifyAsync(refreshTokenPayload.accessToken, { ignoreExpiration: false })
			.then((e) => {
				console.log(e);

				throw new UnauthorizedException("Access token is still valid");
			})
			.catch(() => this.authService.refreshTokens(refreshTokenPayload.body));
	}

	@Get("gmail")
	@UseGuards(ThrottlerBehindProxyGuard)
	public async googleLogin(
		@Req() req: Request,
		@Res() res: Response,
		@Query("code", StringValidationPipe) code: string,
		@Query("error", StringValidationPipe) error: string
	) {
		if (error) {
			throw new BadRequestException(`OAuth login failed: ${error}`);
		}

		if (!code) throw new BadRequestException("`code` param required");

		const redirect_uri = `${req.protocol}://${req.get("host")}${req.path}`;

		const config = await exchangeGoogleToken(code, redirect_uri);

		const { data: user } = await axios
			.get<{ id: string }>(
				`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${config.accessToken}`,
				{
					headers: {
						Authorization: `${config.tokenType} ${config.accessToken}`
					}
				}
			)
			.catch(() => {
				throw new UnauthorizedException("Invalid access token");
			});

		const [accessToken, refreshToken] = await this.authService
			.googleLogin({ google: { ...config, userID: user.id } })
			.catch(handleError);

		res.cookie("accessToken", accessToken);
		res.cookie("refreshToken", refreshToken);

		res.sendFile(join(process.cwd(), "public", "oauth.html"));
	}

	@Get("oauth/tokens")
	public async getOAuthTokens() {
		return { google: googleClientInfo.id };
	}
}
