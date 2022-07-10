import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import IncomingClient from "@utils/interfaces/client/incoming.interface";
import OutgoingClient from "@utils/interfaces/client/outgoing.interface";

import ImapClient from "@utils/imap";
import SmtpClient from "@utils/smtp";

import { Payload } from "./interfaces/payload.interface";
import Server from "./interfaces/server.interface";

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	private readonly incomingClients: Map<string, IncomingClient> = new Map();
	private readonly outgoingClients: Map<string, OutgoingClient> = new Map();

	public async login(config: {
		incoming: Server;
		outgoing: Server;
	}): Promise<string> {
		await this.createIncomingClient(config.incoming).then((client) =>
			this.incomingClients.set(config.incoming.username, client)
		);

		await this.createOutgoingClient(config.outgoing).then((client) =>
			this.outgoingClients.set(config.outgoing.username, client)
		);

		const payload: Payload = {
			username: config.incoming.username,
			sub: config
		};

		const access_token = this.jwtService.sign(payload);

		return access_token;
	}

	private async createIncomingClient(config: Server): Promise<IncomingClient> {
		const client = new ImapClient({
			user: {
				name: config.username,
				password: config.password
			},
			...config
		});

		await client.connect();

		return client;
	}

	private async createOutgoingClient(config: Server): Promise<OutgoingClient> {
		const client = new SmtpClient({
			user: {
				name: config.username,
				password: config.password
			},
			...config
		});

		await client.connect();

		return client;
	}

	public async findConnection(config: {
		incoming: Server;
		outgoing: Server;
	}): Promise<[IncomingClient, OutgoingClient]> {
		let incomingClient = this.incomingClients.get(config.incoming.username);
		let outgoingClient = this.outgoingClients.get(config.outgoing.username);

		if (!incomingClient) {
			incomingClient = await this.createIncomingClient(config.incoming).then(
				(client) => {
					this.incomingClients.set(config.incoming.username, client);

					return client;
				}
			);
		}

		if (!outgoingClient) {
			outgoingClient = await this.createOutgoingClient(config.outgoing).then(
				(client) => {
					this.outgoingClients.set(config.outgoing.username, client);

					return client;
				}
			);
		}

		return [incomingClient, outgoingClient];
	}
}
