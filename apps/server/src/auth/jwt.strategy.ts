import { ExtractJwt, Strategy } from "passport-jwt";

import { JwtToken, MultiConfig } from "./interfaces/jwt.interface";

import {
	Injectable,
	InternalServerErrorException,
	UnauthorizedException
} from "@nestjs/common";
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
