import Config from "./interfaces/config.interface";
import { JwtToken } from "./interfaces/jwt.interface";

import {
	IncomingServiceType,
	OutgoingServiceType,
	LoginResponse
} from "@dust-mail/typings";

import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { jwtConstants } from "@src/constants";
import { ImapService } from "@src/imap/imap.service";
import { SmtpService } from "@src/smtp/smtp.service";

import createTokenResponse from "@utils/createTokenResponse";

type ConfigWithServiceType<T> = Config & {
	service: T;
};

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly imapService: ImapService,
		private readonly smtpService: SmtpService
	) {}

	public refreshTokens(oldRefreshToken: JwtToken): LoginResponse {
		const accessToken = this.jwtService.sign(
			{
				tokenType: "access",
				services: oldRefreshToken.services,
				body: oldRefreshToken.body
			} as JwtToken,
			{
				expiresIn: jwtConstants.accessTokenExpires
			}
		);

		const refreshToken = this.jwtService.sign({
			tokenType: "refresh",
			accessToken,
			services: oldRefreshToken.services,
			body: oldRefreshToken.body
		} as JwtToken);

		return [
			createTokenResponse("access", accessToken),
			createTokenResponse("refresh", refreshToken)
		];
	}

	public async login(config: {
		incoming: ConfigWithServiceType<IncomingServiceType>;
		outgoing: ConfigWithServiceType<OutgoingServiceType>;
	}): Promise<LoginResponse> {
		console.log(config.incoming.service, config.outgoing.service);

		switch (config.incoming.service) {
			case "imap":
				await this.imapService.login(config.incoming);
				break;

			default:
				break;
		}

		switch (config.outgoing.service) {
			case "smtp":
				await this.smtpService.login(config.outgoing);
				break;

			default:
				break;
		}

		const services = {
			incoming: config.incoming.service,
			outgoing: config.outgoing.service
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

		return [
			createTokenResponse("access", accessToken),
			createTokenResponse("refresh", refreshToken)
		];
	}
}
