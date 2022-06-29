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

@Controller("auth")
export class AuthController {
	private allowedDomains?: string[];

	constructor(private authService: AuthService) {
		if (allowedDomains) this.allowedDomains = allowedDomains.split(",");
	}

	@Post("login")
	@UseGuards(ThrottlerBehindProxyGuard)
	async login(
		@Body("server")
		server?: string,
		@Body("port")
		port?: number,
		@Body("username", MailValidationPipe)
		username?: string,
		@Body("password")
		password?: string
	) {
		if (username && password) {
			if (
				server &&
				this.allowedDomains &&
				!this.allowedDomains.includes(server)
			) {
				throw new UnauthorizedException("Mail server is not on whitelist");
			}

			if (!server) {
				const result = await mailDiscover(username).catch(() => {
					return;
				});

				if (result) {
					const [incomingServer] = result;

					server = incomingServer.server;
					port = incomingServer.port;
				}
			}

			const token = await this.authService
				.login(username, password, server, port)
				.then((token) => token)
				.catch(handleError);

			return token;
		}

		throw new BadRequestException("Missing fields");
	}
}
