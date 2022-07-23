import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";

import { jwtConstants } from "./constants";

import { AuthService } from "./auth.service";

import {
	AccessTokenPayload,
	RefreshTokenPayload
} from "./interfaces/payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private authService: AuthService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtConstants.secret
		});
	}

	async validate(payload: AccessTokenPayload | RefreshTokenPayload) {
		if (payload.accessToken)
			throw new UnauthorizedException(
				"Can't use refresh token as access token"
			);

		const [incomingClient, outgoingClient] =
			await this.authService.findConnection(payload.body);

		return {
			incomingClient,
			outgoingClient
		};
	}
}
