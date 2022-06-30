import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import Client from "@utils/imap";

import { Payload } from "./interfaces/payload.interface";
import Server from "./interfaces/server.interface";

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	private readonly clients: Map<string, Client> = new Map();

	public async login(
		username: string,
		password: string,
		config?: { incoming: Server; outgoing: Server }
	): Promise<string> {
		if (!this.clients.get(username)) {
			const client = new Client({
				...config,
				user: { name: username, password }
			});

			await client.connect().then(() => this.clients.set(username, client));
		}

		const payload: Payload = {
			username: username,
			sub: { ...config, password }
		};

		const access_token = this.jwtService.sign(payload);

		return access_token;
	}

	public async findConnection(
		username: string,
		password: string,
		config: { incoming: Server; outgoing: Server }
	): Promise<Client> {
		const client = this.clients.get(username);

		if (!client) {
			const client = new Client({
				...config,
				user: { name: username, password }
			});

			return await client.connect().then(() => {
				this.clients.set(username, client);

				return client;
			});
		}

		return client;
	}
}
