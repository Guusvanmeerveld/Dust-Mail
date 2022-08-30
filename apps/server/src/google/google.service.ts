import { Inject, Injectable } from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";

import { CacheService } from "@cache/cache.service";

import {
	JwtToken,
	IncomingServiceType,
	OutgoingServiceType
} from "@auth/interfaces/jwt.interface";

import IncomingClient from "@mail/interfaces/client/incoming.interface";
import OutgoingClient from "@mail/interfaces/client/outgoing.interface";

import { jwtConstants } from "@src/constants";

import exchangeToken from "./utils/exchangeToken";
import getUserID from "./utils/getUserID";

import Config from "./interfaces/config";

import IncomingGoogleClient from "./incoming";

@Injectable()
export class GoogleService {
	constructor(private readonly jwtService: JwtService) {
		this.clients = new Map();
	}

	@Inject("CACHE")
	private readonly cacheService: CacheService;

	private readonly clients: Map<string, Config>;

	public login = async (
		code: string,
		redirectUri: string
	): Promise<[accessToken: string, refreshToken: string]> => {
		const configWithoutUserID = await exchangeToken(code, redirectUri);

		const userID = await getUserID(
			configWithoutUserID.tokenType,
			configWithoutUserID.accessToken
		);

		const config = { ...configWithoutUserID, userID };

		this.clients.set(userID, config);

		const services: {
			incoming: IncomingServiceType;
			outgoing: OutgoingServiceType;
		} = {
			incoming: "google",
			outgoing: "google"
		};

		const accessTokenPayload: JwtToken = {
			tokenType: "access",
			services,
			body: config
		};

		const accessToken = this.jwtService.sign(accessTokenPayload, {
			expiresIn: jwtConstants.accessTokenExpires
		});

		const refreshTokenPayload: JwtToken = {
			tokenType: "refresh",
			accessToken,
			services,
			body: config
		};

		const refreshToken = this.jwtService.sign(refreshTokenPayload);

		return [accessToken, refreshToken];
	};

	public getClients = (config: Config): [incoming: IncomingClient] => {
		let client = this.clients.get(config.userID);

		if (!client) {
			this.clients.set(config.userID, config);

			client = config;
		}

		if (new Date(client.expires).getTime() < Date.now()) {
		}

		return [new IncomingGoogleClient(config, this.cacheService)];
	};

	public logout = (userID: string): void => {
		this.clients.delete(userID);
	};
}
