import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";

import { jwtConstants } from "./constants";

import { AuthService } from "./auth.service";

import { Payload } from "./interfaces/payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private authService: AuthService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtConstants.secret
		});
	}

	async validate(payload: Payload) {
		const { password, ...config } = payload.sub;

		const client = await this.authService.findConnection(
			payload.username,
			password,
			config
		);

		return {
			client
		};
	}
}
