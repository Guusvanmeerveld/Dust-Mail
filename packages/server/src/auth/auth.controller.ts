import {
	BadRequestException,
	Body,
	Controller,
	Post,
	UseGuards
} from "@nestjs/common";

import { AuthService } from "./auth.service";

import { allowedDomains } from "./constants";

import { MailValidationPipe } from "./pipes/mail.pipe";

import { ThrottlerBehindProxyGuard } from "@utils/guards/throttler-proxy.guard";

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
		@Body("incoming_username", MailValidationPipe)
		incomingUsername?: string,
		@Body("incoming_password")
		incomingPassword?: string,
		@Body("incoming_server")
		incomingServer?: string,
		@Body("incoming_port")
		incomingPort?: number,
		@Body("incoming_security")
		incomingSecurity?: SecurityType,
		@Body("outgoing_username", MailValidationPipe)
		outgoingUsername?: string,
		@Body("outgoing_password")
		outgoingPassword?: string,
		@Body("outgoing_server")
		outgoingServer?: string,
		@Body("outgoing_port")
		outgoingPort?: number,
		@Body("outgoing_security")
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
						username: incomingUsername,
						password: incomingPassword,
						server: incomingServer,
						port: incomingPort,
						security: incomingSecurity
					},
					outgoing: {
						username: outgoingUsername,
						password: outgoingPassword,
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
