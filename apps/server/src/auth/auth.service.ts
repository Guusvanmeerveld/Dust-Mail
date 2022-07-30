import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import IncomingClient from "@mail/interfaces/client/incoming.interface";
import OutgoingClient from "@mail/interfaces/client/outgoing.interface";

import ImapClient from "@mail/imap";
import SmtpClient from "@mail/smtp";

import IncomingGoogleClient from "@mail/google/incoming";

import { createIdentifier } from "@utils/createIdentifier";

import Config from "./interfaces/config.interface";

import { jwtConstants } from "./constants";

type TokenType = "access_token" | "refresh_token";
type TokenResponse = { type: TokenType; body: string; expires: Date };

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	private readonly incomingClients: Map<string, IncomingClient> = new Map();
	private readonly outgoingClients: Map<string, OutgoingClient> = new Map();

	public createTokenResponse(type: TokenType, token: string): TokenResponse {
		let expiry: number;

		if (type == "access_token") expiry = jwtConstants.accessTokenExpires;
		else if (type == "refresh_token") expiry = jwtConstants.refreshTokenExpires;

		return {
			type,
			body: token,
			expires: new Date(Date.now() + expiry * 1000)
		};
	}

	public refreshTokens(config: {
		incoming: Config;
		outgoing: Config;
	}): TokenResponse[] {
		const accessToken = this.jwtService.sign(
			{ accessToken: false, body: config },
			{
				expiresIn: jwtConstants.accessTokenExpires
			}
		);

		const refreshToken = this.jwtService.sign({
			accessToken,
			body: config
		});

		return [
			this.createTokenResponse("access_token", accessToken),
			this.createTokenResponse("refresh_token", refreshToken)
		];
	}

	public async login(config: {
		incoming: Config;
		outgoing: Config;
	}): Promise<TokenResponse[]> {
		await this.createIncomingClient(
			createIdentifier(config.incoming),
			config.incoming
		);

		await this.createOutgoingClient(
			createIdentifier(config.outgoing),
			config.outgoing
		);

		const accessToken = this.jwtService.sign(
			{ accessToken: false, body: config },
			{
				expiresIn: jwtConstants.accessTokenExpires
			}
		);

		const refreshToken = this.jwtService.sign({
			accessToken,
			body: config
		});

		return [
			this.createTokenResponse("access_token", accessToken),
			this.createTokenResponse("refresh_token", refreshToken)
		];
	}

	public async googleLogin(config: Config): Promise<TokenResponse[]> {
		const identifier = createIdentifier(config);

		await this.createIncomingClient(identifier, config);

		// await this.createOutgoingClient(identifier, config);

		const payloadBody = { incoming: config, outgoing: config };

		const accessToken = this.jwtService.sign(
			{ accessToken: false, body: payloadBody },
			{
				expiresIn: jwtConstants.accessTokenExpires
			}
		);

		const refreshToken = this.jwtService.sign({
			accessToken,
			body: payloadBody
		});

		return [
			this.createTokenResponse("access_token", accessToken),
			this.createTokenResponse("refresh_token", refreshToken)
		];
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
			jwtConstants.accessTokenExpires * 1000
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
			jwtConstants.accessTokenExpires * 1000
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
