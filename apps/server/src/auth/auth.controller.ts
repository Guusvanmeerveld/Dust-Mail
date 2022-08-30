import mailDiscover, { detectServiceFromConfig } from "@dust-mail/autodiscover";

import type { Request as ExpressRequest } from "express";

import { JwtService } from "@nestjs/jwt";

import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Post,
	Req,
	UnauthorizedException,
	UseGuards
} from "@nestjs/common";

import { allowedDomains } from "./constants";

import { ThrottlerBehindProxyGuard } from "@utils/guards/throttler-proxy.guard";

import handleError from "@utils/handleError";

import { getClientInfo as getGoogleClientInfo } from "@src/google/constants";

import { LoginResponse, UserError } from "@dust-mail/typings";

import {
	IncomingServiceType,
	JwtToken,
	OutgoingServiceType
} from "./interfaces/jwt.interface";
import type { SecurityType } from "./interfaces/config.interface";

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
	): Promise<LoginResponse> {
		if (incomingUsername && incomingPassword) {
			let incomingService: IncomingServiceType,
				outgoingService: OutgoingServiceType;

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
						incomingService = foundIncomingServer.type;
					}

					if (!outgoingServer) {
						outgoingServer = foundOutgoingServer.server;
						outgoingPort = foundOutgoingServer.port;
						outgoingSecurity = foundOutgoingServer.security;
						outgoingService = foundOutgoingServer.type;
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

			if (!incomingService) {
				incomingService = await detectServiceFromConfig({
					security: incomingSecurity,
					port: incomingPort,
					server: incomingServer
				}).catch(handleError);
			}

			if (!outgoingService) {
				outgoingService = await detectServiceFromConfig({
					security: outgoingSecurity,
					port: outgoingPort,
					server: outgoingServer
				}).catch(handleError);
			}

			return await this.authService
				.login({
					incoming: {
						username: incomingUsername,
						password: incomingPassword,
						server: incomingServer,
						port: incomingPort,
						security: incomingSecurity,
						service: incomingService
					},
					outgoing: {
						username: outgoingUsername,
						password: outgoingPassword,
						server: outgoingServer,
						port: outgoingPort,
						security: outgoingSecurity,
						service: outgoingService
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

		const refreshTokenPayload: JwtToken = await this.jwtService
			.verifyAsync(userRefreshToken)
			.catch(() => {
				throw new UnauthorizedException("Refresh token is invalid");
			});

		if (refreshTokenPayload.tokenType == "access")
			throw new UnauthorizedException(
				"Can't use access token as refresh token"
			);

		return await this.jwtService
			.verifyAsync(refreshTokenPayload.accessToken, { ignoreExpiration: false })
			.then((e) => {
				console.log(e);

				throw new UnauthorizedException("Access token is still valid");
			})
			.catch(() => this.authService.refreshTokens(refreshTokenPayload));
	}

	@Get(["oauth", "tokens"].join("/"))
	public async getOAuthTokens() {
		const googleClientInfo = getGoogleClientInfo();

		return { google: googleClientInfo.id };
	}
}
