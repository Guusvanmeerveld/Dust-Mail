import { getClientInfo } from "./constants";
import exchangeToken from "./utils/exchangeToken";
import getUser from "./utils/getUser";

import mailDiscover from "@dust-mail/autodiscover";
import { IncomingServiceType, OutgoingServiceType } from "@dust-mail/typings";

import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { SecurityType } from "@src/auth/interfaces/config.interface";
import { jwtConstants } from "@src/constants";
import { CryptoService } from "@src/crypto/crypto.service";

import {
	BasicConfig,
	JwtToken,
	OAuthConfig
} from "@auth/interfaces/jwt.interface";

@Injectable()
export class GoogleService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly cryptoService: CryptoService
	) {}

	public login = async (
		code: string,
		redirectUri: string
	): Promise<[accessToken: string, refreshToken: string, username: string]> => {
		const googleConfig = await exchangeToken(code, redirectUri);

		const user = await getUser(
			googleConfig.tokenType,
			googleConfig.accessToken
		);

		const clientInfo = getClientInfo();

		const oauthConfig: OAuthConfig = {
			clientID: clientInfo.id,
			clientSecret: clientInfo.secret,
			refreshToken: googleConfig.refreshToken,
			accessToken: googleConfig.accessToken,
			refreshUrl: "https://accounts.google.com/o/oauth2/token",
			user: { name: user.email, id: user.id }
		};

		const mailServers = await mailDiscover(user.email);

		const incomingServiceType = "imap";
		const outgoingServiceType = "smtp";

		const incoming = mailServers.find(
			(server) => server.type == incomingServiceType
		);
		const outgoing = mailServers.find(
			(server) => server.type == outgoingServiceType
		);

		const configWithUserData = (config: {
			port: number;
			server: string;
			security: SecurityType;
		}) => ({
			...config,
			username: user.email,
			password: googleConfig.refreshToken
		});

		const config: BasicConfig = {
			configType: "basic",
			oauth: oauthConfig,
			incoming: configWithUserData(incoming),
			outgoing: configWithUserData(outgoing)
		};

		const services: {
			incoming: IncomingServiceType;
			outgoing: OutgoingServiceType;
		} = {
			incoming: incomingServiceType,
			outgoing: outgoingServiceType
		};

		const accessTokenPayload: JwtToken = {
			tokenType: "access",
			services,
			body: config
		};

		const accessToken = this.jwtService.sign(
			await this.cryptoService.encryptTokenPayload(accessTokenPayload),
			{
				expiresIn: jwtConstants.accessTokenExpires
			}
		);

		const refreshTokenPayload: JwtToken = {
			tokenType: "refresh",
			accessToken,
			services,
			body: config
		};

		const refreshToken = this.jwtService.sign(
			await this.cryptoService.encryptTokenPayload(refreshTokenPayload)
		);

		return [accessToken, refreshToken, user.email];
	};
}
