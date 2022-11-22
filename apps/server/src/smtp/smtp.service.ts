import Client from "./client";

import { Injectable } from "@nestjs/common";

import OutgoingClient from "@mail/interfaces/client/outgoing.interface";

import { LoginConfig } from "@auth/interfaces/jwt.interface";

@Injectable()
export class SmtpService {
	public get = async (config: LoginConfig): Promise<OutgoingClient> => {
		switch (config.configType) {
			case "basic":
				return new Client(config);
		}
	};
}
