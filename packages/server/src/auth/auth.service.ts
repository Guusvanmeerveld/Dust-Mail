import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import IncomingClient from "@utils/interfaces/client/incoming.interface";
import OutgoingClient from "@utils/interfaces/client/outgoing.interface";

import ImapClient from "@utils/imap";
import SmtpClient from "@utils/smtp";

import { Payload } from "./interfaces/payload.interface";
import Server from "./interfaces/server.interface";
import { jwtConstants } from "./constants";
import { createIdentifier } from "@src/utils/createIdentifier";

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	private readonly incomingClients: Map<string, IncomingClient> = new Map();
	private readonly outgoingClients: Map<string, OutgoingClient> = new Map();

	public async login(config: {
		incoming: Server;
		outgoing: Server;
	}): Promise<string> {
		const payload: Payload = {
			username: config.incoming.username,
			sub: config
		};

		const access_token = this.jwtService.sign(payload);

		await this.createIncomingClient(
			createIdentifier(config.incoming),
			config.incoming
		);

		await this.createOutgoingClient(
			createIdentifier(config.outgoing),
			config.outgoing
		);

		return access_token;
	}

	private async createIncomingClient(
		identifier: string,
		config: Server
	): Promise<IncomingClient> {
		const client = new ImapClient({
			user: {
				name: config.username,
				password: config.password
			},
			...config
		});

		await client.connect();

		this.incomingClients.set(identifier, client);

		client.on("end", () => this.incomingClients.delete(identifier));

		setTimeout(
			() => this.incomingClients.delete(identifier),
			jwtConstants.expires * 1000
		);

		return client;
	}

	private async createOutgoingClient(
		identifier: string,
		config: Server
	): Promise<OutgoingClient> {
		const client = new SmtpClient({
			user: {
				name: config.username,
				password: config.password
			},
			...config
		});

		await client.connect();

		this.outgoingClients.set(identifier, client);

		client.on("end", () => this.outgoingClients.delete(identifier));

		setTimeout(
			() => this.outgoingClients.delete(identifier),
			jwtConstants.expires * 1000
		);

		return client;
	}

	public async findConnection(config: {
		incoming: Server;
		outgoing: Server;
	}): Promise<[IncomingClient, OutgoingClient]> {
		const incomingIdentifier = createIdentifier(config.incoming);
		const outgoingIdentifier = createIdentifier(config.outgoing);

		let incomingClient = this.incomingClients.get(incomingIdentifier);
		let outgoingClient = this.outgoingClients.get(outgoingIdentifier);

		if (!incomingClient)
			incomingClient = await this.createIncomingClient(
				incomingIdentifier,
				config.incoming
			);

		if (!outgoingClient)
			outgoingClient = await this.createOutgoingClient(
				outgoingIdentifier,
				config.outgoing
			);

		return [incomingClient, outgoingClient];
	}
}
