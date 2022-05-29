import {
	BadRequestException,
	Body,
	Controller,
	ParseIntPipe,
	Post,
	UnauthorizedException,
	UseGuards
} from "@nestjs/common";

import { AuthService } from "./auth.service";

import { allowedDomains } from "./constants";

import { MailValidationPipe } from "./pipes/mail.pipe";

import { ThrottlerBehindProxyGuard } from "./throttler-proxy.guard";

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
		@Body("port", ParseIntPipe)
		port?: number,
		@Body("username", MailValidationPipe)
		username?: string,
		@Body("password")
		password?: string
	) {
		if (server && username && password) {
			if (this.allowedDomains && !this.allowedDomains.includes(server)) {
				throw new UnauthorizedException("Mail server is not on whitelist");
			}

			const token = await this.authService
				.login(server, username, password, port)
				.then((token) => token)
				.catch((error) => {
					throw new UnauthorizedException({ error });
				});

			return token;
		}

		throw new BadRequestException("Missing fields");
	}
}
