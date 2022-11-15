import IncomingClient from "./interfaces/client/incoming.interface";
import Token from "./interfaces/token";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { CryptoService, EncryptedData } from "@src/crypto/crypto.service";

import { AuthService } from "@auth/auth.service";
import { JwtToken } from "@auth/interfaces/jwt.interface";

interface AttachmentData {
	id: string;
	message: string;
	box: string;
}

interface AttachmentToken extends AttachmentData, Token {
	tokenType: "attachment";
	accessToken: string;
}

@Injectable()
export class MailService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly cryptoService: CryptoService,
		private readonly authService: AuthService
	) {}

	public getAttachmentDataFromToken = async (
		token: string
	): Promise<[AttachmentData, IncomingClient]> => {
		const encrypted: EncryptedData = await this.jwtService
			.verifyAsync(token)
			.catch(() => {
				throw new UnauthorizedException("Attachment token is invalid");
			});

		const payload =
			await this.cryptoService.decryptTokenPayload<AttachmentToken>(encrypted);

		if (!payload.tokenType || payload.tokenType != "attachment")
			throw new UnauthorizedException(
				"Can't use any other token as attachment token"
			);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { tokenType, accessToken, ...attachmentData } = payload;

		const encryptedAccessTokenPayload: EncryptedData = await this.jwtService
			.verifyAsync(accessToken)
			.catch(() => {
				throw new UnauthorizedException("Access token is not valid");
			});

		const accessTokenPayload =
			await this.cryptoService.decryptTokenPayload<JwtToken>(
				encryptedAccessTokenPayload
			);

		const { incomingClient } =
			await this.authService.validateRefreshOrAccessTokenPayload(
				accessTokenPayload
			);

		return [attachmentData, incomingClient];
	};

	public createAttachmentToken = async (
		attachmentData: AttachmentData,
		userAccessToken: string
	): Promise<string> => {
		const encrypted =
			await this.cryptoService.encryptTokenPayload<AttachmentToken>({
				...attachmentData,
				tokenType: "attachment",
				accessToken: userAccessToken
			});

		return await this.jwtService.signAsync(encrypted);
	};
}
