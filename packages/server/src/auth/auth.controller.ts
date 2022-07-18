import { join } from "path";

import mailDiscover from "mail-discover";

import { Response } from "express";

import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Post,
	Query,
	Req,
	Res,
	UseGuards
} from "@nestjs/common";

import { AuthService } from "./auth.service";

import { allowedDomains } from "./constants";

import { ThrottlerBehindProxyGuard } from "@utils/guards/throttler-proxy.guard";

import handleError from "@utils/handleError";

import exchangeGoogleToken from "@utils/google/exchangeToken";
import { clientInfo as googleClientInfo } from "@utils/google/constants";

import UserError from "@utils/interfaces/error.interface";
import { Request } from "./interfaces/request.interface";
import { SecurityType } from "./interfaces/config.interface";

import { StringValidationPipe } from "./pipes/string.pipe";

@Controller("auth")
export class AuthController {
	private allowedDomains?: string[];

	constructor(private authService: AuthService) {
		if (allowedDomains) this.allowedDomains = allowedDomains.split(",");
	}

	@Post("login")
	@UseGuards(ThrottlerBehindProxyGuard)
	async login(
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

			const token = await this.authService
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

			return token;
		}

		throw new BadRequestException("Missing fields");
	}

	@Get("gmail")
	@UseGuards(ThrottlerBehindProxyGuard)
	async googleLogin(
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

		const tokens = await exchangeGoogleToken(code, redirect_uri);

		const token = await this.authService
			.googleLogin({ google: tokens })
			.catch(handleError);

		res.cookie("jwtToken", token);

		res.sendFile(join(process.cwd(), "public", "oauth.html"));
	}

	@Get("oauth/tokens")
	async getOAuthTokens() {
		return { google: googleClientInfo.id };
	}
}
