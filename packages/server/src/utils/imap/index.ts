import Imap from "imap";

import { EventEmitter } from "events";

import { Config } from "./interfaces/config.interface";
import { State } from "./interfaces/state.interface";

import connect from "./connect";
import { openBox, closeBox, getBoxes } from "./box";
import fetch, { FetchOptions } from "./fetch";

export { Config } from "./interfaces/config.interface";
export { State } from "./interfaces/state.interface";

export default class Client extends EventEmitter {
	private readonly _client: Imap;

	public state: State = State.NOT_READY;

	constructor(config: Config) {
		super();

		const tls = config.port == 993;

		this._client = new Imap({
			user: config.user.name,
			password: config.user.password,
			host: config.server,
			port: config.port ?? 25,
			tls
		});

		this._client.on("ready", () => {
			this.state = State.READY;
			this.emit("ready");
		});

		this._client.on("end", () => {
			this.state = State.NOT_READY;
			this.emit("end");
		});
	}

	public getBoxes = () => getBoxes(this._client);

	public connect = () => connect(this._client);

	/**
	 *
	 * @param name Box name | e.g. "INBOX" or "SPAM"
	 * @param readOnly Read only mode
	 * @returns The box
	 */
	public openBox = (name: string, readOnly?: boolean) =>
		openBox(this._client, name, readOnly);

	/**
	 *
	 * @returns Nothing
	 */
	public closeBox = () => closeBox(this._client);

	public fetch = (options: FetchOptions) => fetch(this._client, options);
}
