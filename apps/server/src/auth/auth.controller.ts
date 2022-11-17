import { AuthService } from "./auth.service";
import { allowedAddresses, allowedDomains } from "./constants";
import type { SecurityType } from "./interfaces/config.interface";
import { JwtToken } from "./interfaces/jwt.interface";
import { Request } from "./interfaces/request.interface";
// import { AccessTokenAuthGuard } from "./jwt-auth.guard";
import { StringValidationPipe } from "./pipes/string.pipe";

import mailDiscover, { detectServiceFromConfig } from "@dust-mail/autodiscover";
import {
	LoginResponse,
	GatewayError,
	IncomingServiceType,
	OutgoingServiceType
} from "@dust-mail/typings";

import {
	BadRequestException,
	Body,
	Controller,
	Get,
	InternalServerErrorException,
	Post,
	Req,
	UnauthorizedException,
	UseGuards
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ApiTags } from "@nestjs/swagger";

import { bearerPrefix } from "@src/constants";
import { CryptoService, EncryptedData } from "@src/crypto/crypto.service";
import { getClientInfo as getGoogleClientInfo } from "@src/google/constants";

import { ThrottlerBehindProxyGuard } from "@utils/guards/throttler-proxy.guard";
import handleError from "@utils/handleError";

@Controller("auth")
@ApiTags("auth")
export class AuthController {
	private allowedDomains?: string[];
	private allowedAddresses?: string[];

	constructor(
		private authService: AuthService,
		private cryptoService: CryptoService,
		private jwtService: JwtService
	) {
		if (allowedDomains) this.allowedDomains = allowedDomains.split(",");
		if (allowedAddresses) this.allowedAddresses = allowedAddresses.split(",");
	}

	@Post("login")
	@UseGuards(ThrottlerBehindProxyGuard)
	public async login(
		@Body("incoming_username", StringValidationPipe)
		incomingUsername?: string,
		@Body("incoming_password", StringValidationPipe)
		incomingPassword?: string,
		@Body("incoming_server", StringValidationPipe)
		incomingServer?: string,
		@Body("incoming_port")
		incomingPort?: number,
		@Body("incoming_security", StringValidationPipe)
		incomingSecurity?: SecurityType,
		@Body("outgoing_username", StringValidationPipe)
		outgoingUsername?: string,
		@Body("outgoing_password", StringValidationPipe)
		outgoingPassword?: string,
		@Body("outgoing_server", StringValidationPipe)
		outgoingServer?: string,
		@Body("outgoing_port")
		outgoingPort?: number,
		@Body("outgoing_security", StringValidationPipe)
		outgoingSecurity?: SecurityType
	): Promise<LoginResponse> {
		if (incomingUsername && incomingPassword) {
			let incomingService: IncomingServiceType,
				outgoingService: OutgoingServiceType;

			if (!incomingServer || !outgoingServer) {
				const result = await mailDiscover(incomingUsername).catch(() => {
					const server = incomingUsername.split("@").pop() as string;

					if (!incomingServer) incomingServer = "mail." + server;
				});

				if (result) {
					const [foundIncomingServer, foundOutgoingServer] = result;

					if (!incomingServer) {
						incomingServer = foundIncomingServer.server;
						incomingPort = foundIncomingServer.port;
						incomingSecurity = foundIncomingServer.security;
						incomingService = foundIncomingServer.type;
					}

					if (!outgoingServer) {
						outgoingServer = foundOutgoingServer.server;
						outgoingPort = foundOutgoingServer.port;
						outgoingSecurity = foundOutgoingServer.security;
						outgoingService = foundOutgoingServer.type;
					}
				}
			}

			if (!outgoingServer) outgoingServer = incomingServer;

			if (
				this.allowedDomains &&
				((incomingServer && !this.allowedDomains.includes(incomingServer)) ||
					(outgoingServer && !this.allowedDomains.includes(outgoingServer)))
			) {
				throw new BadRequestException({
					code: GatewayError.Misc,
					message: "Mail server is not on whitelist"
				});
			}

			if (!incomingSecurity) incomingSecurity = "TLS";
			if (!incomingPort) {
				if (incomingSecurity == "TLS" || incomingSecurity == "STARTTLS")
					incomingPort = 993;
				if (incomingSecurity == "NONE") incomingPort = 143;
			}

			if (!outgoingSecurity) outgoingSecurity = "TLS";
			if (!outgoingPort) {
				if (outgoingSecurity == "TLS") outgoingPort = 465;
				if (outgoingSecurity == "STARTTLS") outgoingPort = 587;
				if (outgoingSecurity == "NONE") outgoingPort = 25;
			}

			if (!outgoingUsername) outgoingUsername = incomingUsername;
			if (!outgoingPassword) outgoingPassword = outgoingPassword;

			if (
				this.allowedAddresses &&
				(!this.allowedAddresses.includes(incomingUsername) ||
					!this.allowedAddresses.includes(outgoingUsername))
			) {
				throw new BadRequestException({
					code: GatewayError.Misc,
					message: "Email address is not on whitelist"
				});
			}

			if (!incomingService) {
				incomingService = (await detectServiceFromConfig({
					security: incomingSecurity,
					port: incomingPort,
					server: incomingServer
				}).catch(handleError)) as IncomingServiceType;
			}

			if (!outgoingService && outgoingServer) {
				outgoingService = (await detectServiceFromConfig({
					security: outgoingSecurity,
					port: outgoingPort,
					server: outgoingServer
				}).catch(handleError)) as OutgoingServiceType;
			}

			if (incomingService == "pop3")
				throw new InternalServerErrorException("Pop3 is not supported yet");

			return await this.authService
				.login({
					incoming: {
						username: incomingUsername,
						password: incomingPassword,
						server: incomingServer,
						port: incomingPort,
						security: incomingSecurity,
						service: incomingService
					},
					outgoing: {
						username: outgoingUsername,
						password: outgoingPassword,
						server: outgoingServer,
						port: outgoingPort,
						security: outgoingSecurity,
						service: outgoingService
					}
				})
				.catch(handleError);
		}

		throw new BadRequestException("Missing fields");
	}

	// @Get("logout")
	// @UseGuards(AccessTokenAuthGuard)
	// public async logout(@Req() req: Request) {
	// 	req.user.incomingClient
	// }

	private readonly bearerPrefix = bearerPrefix;

	@Get("refresh")
	public async refreshTokens(
		@Req()
		req: Request
	) {
		const authHeader = req.headers.authorization;

		if (!authHeader.startsWith(this.bearerPrefix))
			throw new BadRequestException("Auth token should be of type bearer");

		const userRefreshToken = authHeader?.slice(
			this.bearerPrefix.length,
			authHeader?.length
		);

		const encryptedRefreshTokenPayload: EncryptedData = await this.jwtService
			.verifyAsync(userRefreshToken)
			.catch(() => {
				throw new UnauthorizedException("Refresh token is invalid");
			});

		const refreshTokenPayload =
			await this.cryptoService.decryptTokenPayload<JwtToken>(
				encryptedRefreshTokenPayload
			);

		if (refreshTokenPayload.tokenType != "refresh")
			throw new UnauthorizedException(
				"Can't use any other token as refresh token"
			);

		const data: false | LoginResponse = await this.jwtService
			.verifyAsync(refreshTokenPayload.accessToken, { ignoreExpiration: false })
			.then((): false => false)
			.catch(() => {
				return this.authService.refreshTokens(refreshTokenPayload);
			});

		if (!data) throw new UnauthorizedException("Access token is still valid");
		else return data;
	}

	@Get(["oauth", "tokens"].join("/"))
	public async getOAuthTokens() {
		const googleClientInfo = getGoogleClientInfo();

		return { google: googleClientInfo.id };
	}
}
