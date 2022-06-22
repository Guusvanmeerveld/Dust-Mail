import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import Client, { Config } from "@utils/imap";

import { Payload } from "./interfaces/payload.interface";

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	private readonly clients: Map<string, Client> = new Map();

	public async login(
		username: string,
		password: string,
		server?: string,
		port?: number
	): Promise<string> {
		if (!this.clients.get(username)) {
			const config = this.createConfig(username, password, server, port);

			const client = new Client(config);

			await client.connect().then(() => this.clients.set(username, client));
		}

		const payload: Payload = {
			username: username,
			sub: { server, port, password }
		};

		const access_token = this.jwtService.sign(payload);

		return access_token;
	}

	private createConfig = (
		username: string,
		password: string,
		server: string,
		port?: number
	): Config => {
		const config: Config = {
			server: server,
			port: port,
			user: { name: username, password: password }
		};

		return config;
	};

	public async findConnection(
		username: string,
		password: string,
		server: string,
		port: number
	): Promise<Client> {
		const client = this.clients.get(username);

		if (!client) {
			const config = this.createConfig(username, password, server, port);

			const client = new Client(config);

			return await client.connect().then(() => {
				this.clients.set(username, client);

				return client;
			});
		}

		return client;
	}
}
