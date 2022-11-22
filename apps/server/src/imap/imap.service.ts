import Imap from "imap";

import Client from "./client";
import connect from "./connect";

import { Injectable } from "@nestjs/common";

import { CacheService } from "@src/cache/cache.service";
// import { getClientInfo } from "@src/google/constants";
import { createIdentifier } from "@src/utils/createIdentifier";
import getOAuthToken from "@src/utils/getOAuthToken";

import IncomingClient from "@mail/interfaces/client/incoming.interface";

import { BasicConfig } from "@auth/interfaces/jwt.interface";

@Injectable()
export class ImapService {
	constructor(private readonly cacheService: CacheService) {
		this.clients = new Map();
	}

	private readonly authTimeout = 30 * 1000;

	private readonly clients: Map<string, Imap>;

	public login = async (config: BasicConfig): Promise<Imap> => {
		const identifier = createIdentifier(config);

		const incoming = config.incoming;

		let xoauth2: string;
		if (config.oauth) xoauth2 = await getOAuthToken(config.oauth);

		const client = new Imap({
			user: incoming.username,
			password: incoming.password,
			host: incoming.server,
			port: incoming.port,
			tls: incoming.security != "NONE",
			xoauth2,
			authTimeout: this.authTimeout,
			tlsOptions: {
				rejectUnauthorized: false
			}
		});

		const _client = await connect(client);

		const existingClient = this.clients.get(identifier);

		const existingClientIsNotAuthenticated =
			existingClient && existingClient.state == "connected";

		if (!existingClient || existingClientIsNotAuthenticated) {
			if (existingClientIsNotAuthenticated) existingClient.destroy();

			this.clients.set(identifier, _client);

			return _client;
		}

		return existingClient;
	};

	public get = async (config: BasicConfig): Promise<IncomingClient> => {
		const identifier = createIdentifier(config);

		let client = this.clients.get(identifier);

		if (!client) client = await this.login(config);

		if (client.state == "disconnected") client.connect();

		return new Client(client, this.cacheService, identifier);
	};

	public logout = async (config: BasicConfig): Promise<void> => {
		const identifier = createIdentifier(config);

		const client = this.clients.get(identifier);

		if (!client) return;

		client.destroy();

		this.clients.delete(identifier);
	};
}
