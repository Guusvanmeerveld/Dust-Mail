import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import * as imaps from "imap-simple";

import { jwtConstants } from "./constants";

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

			this.clients.set(username, connection);

			setTimeout(
				() => this.clients.delete(username),
				jwtConstants.expires * 1000
			);

			return access_token;
		});
	}

	findConnection(username: string): imaps.ImapSimple {
		const connection = this.clients.get(username);

		if (!connection)
			throw new UnauthorizedException("Token expired or was never created");

		return connection;
	}
}
