import nodemailer, { Transporter } from "nodemailer";

import send from "./send";

import { OutgoingMessage } from "@dust-mail/typings";

import OutgoingClient from "@mail/interfaces/client/outgoing.interface";

import { BasicConfig } from "@auth/interfaces/jwt.interface";

export default class Client implements OutgoingClient {
	constructor(private readonly config: BasicConfig) {}

	private _client: Transporter;

	private readonly authTimeout = 30 * 1000;

	public connect = async (): Promise<void> => {
		const outgoing = this.config.outgoing;

		const oauth = this.config.oauth;

		this._client = nodemailer.createTransport({
			host: outgoing.server,
			port: outgoing.port,
			secure: outgoing.security == "TLS",
			connectionTimeout: this.authTimeout,
			auth: oauth
				? {
						type: "OAuth2",
						user: oauth.user.name,
						clientId: oauth.clientID,
						clientSecret: oauth.clientSecret,
						refreshToken: oauth.refreshToken,
						accessToken: oauth.accessToken,
						accessUrl: oauth.refreshUrl
				  }
				: {
						type: "Login",
						user: outgoing.username,
						pass: outgoing.password
				  }
		});
	};

	public disconnect = async (): Promise<void> => {
		this._client.close();
	};

	public send = (message: OutgoingMessage) => send(this._client, message);
}
