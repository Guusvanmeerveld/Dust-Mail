import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import autodiscoverServer from "../../../autodiscover";

import Client, { Config } from "../utils/imap";

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
		if (!server) {
			const [imap] = await autodiscoverServer(username, password);

			(server = imap.server), (port = imap.port);
		}

		const config = this.createConfig(username, password, server, port);

		const client = new Client(config);

		return await client.connect().then(() => {
			const payload = { username: username, sub: { server, port, password } };

			const access_token = this.jwtService.sign(payload);

			if (!this.clients.get(username)) {
				this.clients.set(username, client);
			}

			return access_token;
		});
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
