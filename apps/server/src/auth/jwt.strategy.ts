import { ExtractJwt, Strategy } from "passport-jwt";

import { AuthService } from "./auth.service";
import { JwtToken } from "./interfaces/jwt.interface";

import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";

import { jwtConstants } from "@src/constants";
import { CryptoService, EncryptedData } from "@src/crypto/crypto.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly authService: AuthService,
		private readonly cryptoService: CryptoService
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtConstants.getSecretSync()
		});
	}

	async validate(encrypted: EncryptedData) {
		const payload = await this.cryptoService.decryptTokenPayload<JwtToken>(
			encrypted
		);

		return this.authService.validateRefreshOrAccessTokenPayload(payload);
	}
}
