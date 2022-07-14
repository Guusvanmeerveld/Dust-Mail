import EventEmitter from "events";

import Config from "@auth/interfaces/config.interface";

import { State } from "@utils/interfaces/state.interface";
import IncomingClient from "@utils/interfaces/client/incoming.interface";

import Tokens from "../interfaces/tokens";

import connect from "./connect";
import { getBox, getBoxes, getBoxMessages } from "./box";
import { getMessage } from "./message";

export default class IncomingGoogleClient
	extends EventEmitter
	implements IncomingClient
{
	public state = State.NOT_READY;

	private config: Tokens;

	constructor({ google }: Config) {
		super();

		this.config = { ...google, expires: new Date(google.expires) };
	}

	private refreshToken = async (): Promise<string> => {
		if (this.config.expires.getTime() < Date.now()) {
			console.log("expired");
		}

		return `${this.config.tokenType} ${this.config.accessToken}`;
	};

	public connect = () =>
		this.refreshToken().then(() => connect(this.config.accessToken));

	public getBoxes = () =>
		this.refreshToken().then((authorization) => getBoxes(authorization));

	public getBox = (boxName: string) =>
		this.refreshToken().then((authorization) => getBox(authorization, boxName));

	public getBoxMessages = (
		boxName: string,
		options: { start: number; end: number }
	) =>
		this.refreshToken().then((authorization) =>
			getBoxMessages(authorization, boxName, options)
		);

	public getMessage = (id: string, boxName: string, markAsRead: boolean) =>
		this.refreshToken().then((authorization) =>
			getMessage(authorization, id, boxName, markAsRead)
		);
}
