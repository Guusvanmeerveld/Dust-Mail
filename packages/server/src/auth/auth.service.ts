import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import imaps from "imap-simple";

import { jwtConstants } from "./constants";

import Error from "./enums/error.enum";

import { fetchServerFromEmail } from "./utils/autodiscover";

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	private readonly clients: Map<string, imaps.ImapSimple> = new Map();

	async login(
		username: string,
		password: string,
		server?: string,
		port?: number
	): Promise<string> {
		// if (!server) {
		// 	const info = await fetchServerFromEmail(username, password);

		// 	console.log(info);
		// }

		const tls = port == 993;

		const config: imaps.ImapSimpleOptions = {
			imap: {
				host: server,
				port: port ?? 25,
				tls,
				user: username,
				password: password,
				authTimeout: 6000
			}
		};

		return await imaps
			.connect(config)
			.then((connection) => {
				const payload = { username: username, sub: server };

				const access_token = this.jwtService.sign(payload);

				if (!this.clients.get(username)) {
					this.clients.set(username, connection);
				}

				setTimeout(
					() => this.clients.delete(username),
					jwtConstants.expires * 1000
				);

				return access_token;
			})
			.catch((error) => {
				throw this.parseError(error);
			});
	}

	parseError(error: any): Error {
		// console.log(error);

		if (error.source == "socket") {
			return Error.Network;
		}

		if (error.source == "timeout") {
			return Error.Timeout;
		}

		if (error.source == "authentication") {
			return Error.Credentials;
		}

		return Error.Misc;
	}

	findConnection(username: string): imaps.ImapSimple {
		const connection = this.clients.get(username);

		if (!connection)
			throw new UnauthorizedException("Token expired or was never created");

		return connection;
	}
}
