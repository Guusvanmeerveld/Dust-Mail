import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import IncomingClient from "@utils/interfaces/client/incoming.interface";
import OutgoingClient from "@utils/interfaces/client/outgoing.interface";

import ImapClient from "@utils/imap";
import SmtpClient from "@utils/smtp";
import IncomingGoogleClient from "@utils/google/incoming";

import { createIdentifier } from "@utils/createIdentifier";

import { Payload } from "./interfaces/payload.interface";
import Config from "./interfaces/config.interface";

import { jwtConstants } from "./constants";

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	private readonly incomingClients: Map<string, IncomingClient> = new Map();
	private readonly outgoingClients: Map<string, OutgoingClient> = new Map();

	public async login(config: {
		incoming: Config;
		outgoing: Config;
	}): Promise<string> {
		const payload: Payload = {
			username: "mail",
			sub: config
		};

		await this.createIncomingClient(
			createIdentifier(config.incoming),
			config.incoming
		);

		await this.createOutgoingClient(
			createIdentifier(config.outgoing),
			config.outgoing
		);

		const access_token = this.jwtService.sign(payload);

		return access_token;
	}

	public async googleLogin(config: Config): Promise<string> {
		const payload: Payload = {
			username: "google",
			sub: { incoming: config, outgoing: config }
		};

		await this.createIncomingClient(createIdentifier(config), config);

		// await this.createOutgoingClient(createIdentifier(config), config);

		const access_token = this.jwtService.sign(payload);

		return access_token;
	}

	private async createIncomingClient(
		identifier: string,
		config: Config
	): Promise<IncomingClient> {
		let client: IncomingClient;

		if (config.mail) client = new ImapClient(config);
		else if (config.google) client = new IncomingGoogleClient(config);

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
		config: Config
	): Promise<OutgoingClient> {
		let client: OutgoingClient;

		if (config.mail) client = new SmtpClient(config);

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
		incoming: Config;
		outgoing: Config;
	}): Promise<[IncomingClient, OutgoingClient]> {
		const incomingIdentifier = createIdentifier(config.incoming);
		const outgoingIdentifier = createIdentifier(config.outgoing);

		let incomingClient = this.incomingClients.get(incomingIdentifier);
		const outgoingClient = this.outgoingClients.get(outgoingIdentifier);

		if (!incomingClient)
			incomingClient = await this.createIncomingClient(
				incomingIdentifier,
				config.incoming
			);

		// if (!outgoingClient)
		// 	outgoingClient = await this.createOutgoingClient(
		// 		outgoingIdentifier,
		// 		config.outgoing
		// 	);

		return [incomingClient, outgoingClient];
	}
}
