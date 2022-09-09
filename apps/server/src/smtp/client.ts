import { Transporter } from "nodemailer";

import send from "./send";

import { OutgoingMessage } from "@dust-mail/typings";

import { CacheService } from "@src/cache/cache.service";

import OutgoingClient from "@mail/interfaces/client/outgoing.interface";

export default class Client implements OutgoingClient {
	constructor(
		private readonly _client: Transporter,
		private readonly cacheService: CacheService
	) {}

	public send = (message: OutgoingMessage) => send(this._client, message);
}
