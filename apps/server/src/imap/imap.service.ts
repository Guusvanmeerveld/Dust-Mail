import Imap from "imap";

import Client from "./client";
import connect from "./connect";

import { Inject, Injectable } from "@nestjs/common";

import { CacheService } from "@src/cache/cache.service";
import { createIdentifier } from "@src/utils/createIdentifier";

import IncomingClient from "@mail/interfaces/client/incoming.interface";

import Config from "@auth/interfaces/config.interface";

@Injectable()
export class ImapService {
	constructor() {
		this.clients = new Map();
	}

	private readonly authTimeout = 30 * 1000;

	@Inject("CACHE")
	private readonly cacheService: CacheService;

	private readonly clients: Map<string, Imap>;

	public login = async (config: Config): Promise<Imap> => {
		const client = new Imap({
			user: config.username,
			password: config.password,
			host: config.server,
			port: config.port,
			tls: config.security != "NONE",
			authTimeout: this.authTimeout,
			tlsOptions: {
				rejectUnauthorized: false
			}
		});

		return await connect(client).then((_client) => {
			const identifier = createIdentifier(config);

			if (!this.clients.get(identifier)) this.clients.set(identifier, _client);

			return _client;
		});
	};

	public getClient = async (config: Config): Promise<IncomingClient> => {
		const identifier = createIdentifier(config);

		let client = this.clients.get(identifier);

		if (!client) {
			client = await this.login(config);
		}

		return new Client(client, this.cacheService, identifier);
	};

	public logout = (config: Config): void => {
		const identifier = createIdentifier(config);

		const client = this.clients.get(identifier);

		if (!client) return;

		client.destroy();

		this.clients.delete(identifier);
	};
}
