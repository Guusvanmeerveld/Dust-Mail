import {
	BadRequestException,
	Body,
	Controller,
	Post,
	UnauthorizedException
} from "@nestjs/common";

import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post("login")
	async login(
		@Body("server")
		server?: string,
		@Body("port")
		port?: number,
		@Body("username")
		username?: string,
		@Body("password")
		password?: string
	) {
		if (server && username && password) {
			const token = await this.authService
				.login(server, username, password, port)
				.then((token) => token)
				.catch((error) => {
					throw new UnauthorizedException({ error });
				});

			if (!token) throw new UnauthorizedException("Unauthorized");

			return { access_token: token };
		}

		throw new BadRequestException("Missing fields");
	}
}
