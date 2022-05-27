import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import * as imaps from "imap-simple";

import { jwtExpiry } from "./constants";

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	private readonly clients: Map<string, imaps.ImapSimple> = new Map();

	async login(
		server: string,
		username: string,
		password: string,
		port?: number
	): Promise<string> {
		const tls = port == 993;

		const config = {
			imap: {
				host: server,
				port: port ?? 25,
				tls,
				user: username,
				password: password
			}
		};

		return await imaps.connect(config).then((connection) => {
			const payload = { username: username, sub: server };

			const access_token = this.jwtService.sign(payload);

			this.clients.set(access_token, connection);

			setTimeout(() => this.clients.delete(access_token), jwtExpiry * 1000);

			return access_token;
		});
	}

	findConnection(access_token: string): imaps.ImapSimple {
		const connection = this.clients.get(access_token);

		if (!connection)
			throw new UnauthorizedException("Token expired or was never created");

		return connection;
	}
}
