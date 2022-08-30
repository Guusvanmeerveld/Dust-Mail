import { Transporter } from "nodemailer";

import { OutgoingMessage } from "@dust-mail/typings";

import OutgoingClient from "@mail/interfaces/client/outgoing.interface";

import { CacheService } from "@src/cache/cache.service";

import send from "./send";

export default class Client implements OutgoingClient {
	constructor(
		private readonly _client: Transporter,
		private readonly cacheService: CacheService
	) {}

	public send = (message: OutgoingMessage) => send(this._client, message);
}
