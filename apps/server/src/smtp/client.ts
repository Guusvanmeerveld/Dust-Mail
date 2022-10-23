import nodemailer, { Transporter } from "nodemailer";

import send from "./send";

import { OutgoingMessage } from "@dust-mail/typings";

import { CacheService } from "@src/cache/cache.service";

import OutgoingClient from "@mail/interfaces/client/outgoing.interface";

import Config from "@auth/interfaces/config.interface";

export default class Client implements OutgoingClient {
	constructor(
		private readonly cacheService: CacheService,
		private readonly config: Config
	) {}

	private _client: Transporter;

	private readonly authTimeout = 30 * 1000;

	public connect = async (): Promise<void> => {
		this._client = nodemailer.createTransport({
			host: this.config.server,
			port: this.config.port,
			secure: this.config.security == "TLS",
			connectionTimeout: this.authTimeout,
			auth: {
				user: this.config.username,
				pass: this.config.password
			}
		});
	};

	public disconnect = async (): Promise<void> => {
		this._client.close();
	};

	public send = (message: OutgoingMessage) => send(this._client, message);
}
