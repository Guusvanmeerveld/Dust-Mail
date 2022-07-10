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
		const [incomingClient, outgoingClient] =
			await this.authService.findConnection(payload.sub);

		return {
			incomingClient,
			outgoingClient
		};
	}
}
