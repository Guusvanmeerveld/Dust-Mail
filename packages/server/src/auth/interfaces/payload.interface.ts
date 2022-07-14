import Config, { PayloadType } from "./config.interface";

export interface Payload {
	username: PayloadType;
	sub: {
		incoming: Config;
		outgoing: Config;
	};
}
