import Imap from "imap";

// import xoauth2 from "xoauth2";
import Client from "./client";
import connect from "./connect";

import { Injectable } from "@nestjs/common";

import { CacheService } from "@src/cache/cache.service";
// import { getClientInfo } from "@src/google/constants";
import { createIdentifier } from "@src/utils/createIdentifier";

import IncomingClient from "@mail/interfaces/client/incoming.interface";

import Config from "@auth/interfaces/config.interface";

@Injectable()
export class ImapService {
	constructor(private readonly cacheService: CacheService) {
		this.clients = new Map();
	}

	private readonly authTimeout = 30 * 1000;

	private readonly clients: Map<string, Imap>;

	// private readonly googleClientInfo = getClientInfo();

	// private getOAuth2Token = async (
	// 	config: Config
	// ): Promise<string | undefined> => {
	// 	console.log(config.server);

	// 	switch (config.server) {
	// 		case "imap.gmail.com":
	// 			const xoauth2gen = xoauth2.createXOAuth2Generator({
	// 				user: config.username,
	// 				clientId: this.googleClientInfo.id,
	// 				clientSecret: this.googleClientInfo.secret,
	// 				refreshToken: "{User Refresh Token}"
	// 			});

	// 			xoauth2gen.getToken((error, token) => {
	// 				console.log(error);
	// 			});
	// 			break;

	// 		default:
	// 			break;
	// 	}

	// 	return;
	// };

	public login = async (config: Config): Promise<Imap> => {
		let xoauth2: string;

		const client = new Imap({
			user: config.username,
			password: config.password,
			host: config.server,
			port: config.port,
			xoauth2,
			tls: config.security != "NONE",
			authTimeout: this.authTimeout,
			tlsOptions: {
				rejectUnauthorized: false
			}
		});

		const _client = await connect(client);

		const identifier = createIdentifier(config);

		const existingClient = this.clients.get(identifier);

		if (!existingClient) {
			this.clients.set(identifier, _client);

			return _client;
		}

		return existingClient;
	};

	public get = async (config: Config): Promise<IncomingClient> => {
		const identifier = createIdentifier(config);

		let client = this.clients.get(identifier);

		if (!client) client = await this.login(config);

		if (client.state == "connected") client.connect();

		return new Client(client, this.cacheService, identifier);
	};

	public logout = async (config: Config): Promise<void> => {
		const identifier = createIdentifier(config);

		const client = this.clients.get(identifier);

		if (!client) return;

		client.destroy();

		this.clients.delete(identifier);
	};
}
