import { EventEmitter } from "events";

import nodemailer, { Transporter } from "nodemailer";

import OutgoingClient, {
	Config
} from "@utils/interfaces/client/outgoing.interface";

import { State } from "@utils/interfaces/state.interface";
import { OutgoingMessage } from "@utils/interfaces/message";

import connect from "./connect";
import send from "./send";

export default class Client extends EventEmitter implements OutgoingClient {
	private readonly _client: Transporter;

	public state = State.NOT_READY;

	constructor(config: Config) {
		super();

		this._client = nodemailer.createTransport({
			host: config.server,
			port: config.port,
			secure: config.security == "TLS",
			auth: {
				user: config.user.name,
				pass: config.user.password
			}
		});

		this._client.on("error", () => {
			this.state = State.NOT_READY;
			this.emit("error");
		});
	}

	public connect = () => connect(this._client);

	public send = (message: OutgoingMessage) => send(this._client, message);
}
