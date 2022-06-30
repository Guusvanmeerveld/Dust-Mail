import {
	BadRequestException,
	Body,
	Controller,
	Post,
	UnauthorizedException,
	UseGuards
} from "@nestjs/common";

import { AuthService } from "./auth.service";

import { allowedDomains } from "./constants";

import { MailValidationPipe } from "./pipes/mail.pipe";

import { ThrottlerBehindProxyGuard } from "./throttler-proxy.guard";

import handleError from "@utils/handleError";

import mailDiscover from "mail-discover";
import UserError from "@utils/interfaces/error.interface";
import { SecurityType } from "./interfaces/server.interface";

@Controller("auth")
export class AuthController {
	private allowedDomains?: string[];

	constructor(private authService: AuthService) {
		if (allowedDomains) this.allowedDomains = allowedDomains.split(",");
	}

	@Post("login")
	@UseGuards(ThrottlerBehindProxyGuard)
	async login(
		@Body("username", MailValidationPipe)
		username?: string,
		@Body("password")
		password?: string,
		@Body("incoming_server")
		incomingServer?: string,
		@Body("incoming_port")
		incomingPort?: number,
		@Body("incoming_security")
		incomingSecurity?: SecurityType,
		@Body("outgoing_server")
		outgoingServer?: string,
		@Body("outgoing_port")
		outgoingPort?: number,
		@Body("outgoing_security")
		outgoingSecurity?: SecurityType
	) {
		if (username && password) {
			if (
				this.allowedDomains &&
				((incomingServer && !this.allowedDomains.includes(incomingServer)) ||
					(outgoingServer && !this.allowedDomains.includes(outgoingServer)))
			) {
				throw new UnauthorizedException({
					code: UserError.Misc,
					message: "Mail server is not on whitelist"
				});
			}

			if (!incomingServer || !outgoingServer) {
				const result = await mailDiscover(username).catch((e: Error) => {
					if (!incomingServer) {
						throw new BadRequestException({
							code: UserError.Misc,
							message: e.message
						});
					}
				});

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

			if (!incomingPort) incomingPort = 143;
			if (!incomingSecurity) incomingSecurity = "NONE";

			if (!outgoingPort) outgoingPort = 25;
			if (!outgoingSecurity) outgoingSecurity = "NONE";

			const token = await this.authService
				.login(username, password, {
					incoming: {
						server: incomingServer,
						port: incomingPort,
						security: incomingSecurity
					},
					outgoing: {
						server: outgoingServer,
						port: outgoingPort,
						security: outgoingSecurity
					}
				})
				.then((token) => token)
				.catch(handleError);

			return token;
		}

		throw new BadRequestException("Missing fields");
	}
}
