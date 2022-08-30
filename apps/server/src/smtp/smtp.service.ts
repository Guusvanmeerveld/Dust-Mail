import { Inject, Injectable } from "@nestjs/common";

import nodemailer, { Transporter } from "nodemailer";

import Config from "@auth/interfaces/config.interface";

import OutgoingClient from "@src/mail/interfaces/client/outgoing.interface";

import { CacheService } from "@src/cache/cache.service";

import { createIdentifier } from "@src/utils/createIdentifier";

import Client from "./client";

@Injectable()
export class SmtpService {
	constructor() {
		this.clients = new Map();
	}

	@Inject("CACHE")
	private readonly cacheService: CacheService;

	private readonly clients: Map<string, Transporter>;

	public login = async (config: Config): Promise<Transporter> => {
		const client = nodemailer.createTransport({
			host: config.server,
			port: config.port,
			secure: config.security == "TLS",
			auth: {
				user: config.username,
				pass: config.password
			}
		});

		const identifier = createIdentifier(config);

		if (!this.clients.get(identifier)) this.clients.set(identifier, client);

		return client;
	};

	public getClient = async (config: Config): Promise<OutgoingClient> => {
		const identifier = createIdentifier(config);

		let client = this.clients.get(identifier);

		if (!client) {
			client = await this.login(config);
		}

		return new Client(client, this.cacheService);
	};

	public logout = (config: Config): void => {
		const identifier = createIdentifier(config);

		const client = this.clients.get(identifier);

		if (!client) return;

		client.close();

		this.clients.delete(identifier);
	};
}
