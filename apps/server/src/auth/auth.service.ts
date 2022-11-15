import Config from "./interfaces/config.interface";
import { JwtToken, MultiConfig } from "./interfaces/jwt.interface";

import {
	IncomingServiceType,
	OutgoingServiceType,
	LoginResponse
} from "@dust-mail/typings";

import {
	Injectable,
	InternalServerErrorException,
	UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { jwtConstants } from "@src/constants";
import { CryptoService } from "@src/crypto/crypto.service";
import { GoogleService } from "@src/google/google.service";
import GoogleConfig from "@src/google/interfaces/config";
import { ImapService } from "@src/imap/imap.service";
import { SmtpService } from "@src/smtp/smtp.service";

import createTokenResponse from "@utils/createTokenResponse";

import IncomingClient from "@mail/interfaces/client/incoming.interface";
import OutgoingClient from "@mail/interfaces/client/outgoing.interface";

type ConfigWithServiceType<T> = Config & {
	service: T;
};

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly imapService: ImapService,
		private readonly smtpService: SmtpService,
		private readonly googleService: GoogleService,
		private readonly cryptoService: CryptoService
	) {}

	public async refreshTokens(
		oldRefreshToken: JwtToken
	): Promise<LoginResponse> {
		const accessToken = this.jwtService.sign(
			await this.cryptoService.encryptTokenPayload<JwtToken>({
				tokenType: "access",
				services: oldRefreshToken.services,
				body: oldRefreshToken.body
			}),
			{
				expiresIn: jwtConstants.accessTokenExpires
			}
		);

		const refreshToken = this.jwtService.sign(
			await this.cryptoService.encryptTokenPayload<JwtToken>({
				tokenType: "refresh",
				accessToken,
				services: oldRefreshToken.services,
				body: oldRefreshToken.body
			})
		);

		return [
			createTokenResponse("access", accessToken),
			createTokenResponse("refresh", refreshToken)
		];
	}

	public async login(config: {
		incoming: ConfigWithServiceType<IncomingServiceType>;
		outgoing: ConfigWithServiceType<OutgoingServiceType>;
	}): Promise<LoginResponse> {
		switch (config.incoming.service) {
			case "imap":
				await this.imapService.login(config.incoming);
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

		return [
			createTokenResponse("access", accessToken),
			createTokenResponse("refresh", refreshToken)
		];
	}

	public async validateRefreshOrAccessTokenPayload(payload: JwtToken) {
		if (payload.tokenType != "access")
			throw new UnauthorizedException(
				"Can't use any other token as access token"
			);

		let incomingClient: IncomingClient, outgoingClient: OutgoingClient;

		switch (payload.services.incoming) {
			case "imap":
				incomingClient = await this.imapService.get(
					(payload.body as MultiConfig).incoming
				);
				break;

			case "pop3":
				throw new InternalServerErrorException("Pop3 is not supported yet");

			default:
				break;
		}

		switch (payload.services.outgoing) {
			case "smtp":
				outgoingClient = await this.smtpService.get(
					(payload.body as MultiConfig).outgoing
				);
				break;

			default:
				break;
		}

		if (
			payload.services.incoming == "google" &&
			payload.services.outgoing == "google"
		) {
			[incomingClient] = this.googleService.getClients(
				payload.body as GoogleConfig
			);
		}

		return {
			incomingClient,
			outgoingClient
		};
	}
}
