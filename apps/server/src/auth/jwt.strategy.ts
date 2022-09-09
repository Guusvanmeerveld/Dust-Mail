import { ExtractJwt, Strategy } from "passport-jwt";

import { JwtToken, MultiConfig } from "./interfaces/jwt.interface";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";

import { jwtConstants } from "@src/constants";
import { GoogleService } from "@src/google/google.service";
import GoogleConfig from "@src/google/interfaces/config";
import { ImapService } from "@src/imap/imap.service";
import { SmtpService } from "@src/smtp/smtp.service";

import IncomingClient from "@mail/interfaces/client/incoming.interface";
import OutgoingClient from "@mail/interfaces/client/outgoing.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly googleService: GoogleService,
		private readonly imapService: ImapService,
		private readonly smtpService: SmtpService
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtConstants.getSecretSync()
		});
	}

	async validate(payload: JwtToken) {
		if (payload.tokenType == "refresh")
			throw new UnauthorizedException(
				"Can't use refresh token as access token"
			);

		let incomingClient: IncomingClient, outgoingClient: OutgoingClient;

		switch (payload.services.incoming) {
			case "imap":
				incomingClient = await this.imapService.getClient(
					(payload.body as MultiConfig).incoming
				);
				break;

			case "pop3":
				break;

			default:
				break;
		}

		switch (payload.services.outgoing) {
			case "smtp":
				outgoingClient = await this.smtpService.getClient(
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
