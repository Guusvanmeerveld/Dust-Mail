import Client from "./client";

import { Inject, Injectable } from "@nestjs/common";

import { CacheService } from "@cache/cache.service";

import OutgoingClient from "@mail/interfaces/client/outgoing.interface";

import Config from "@auth/interfaces/config.interface";

@Injectable()
export class SmtpService {
	@Inject("CACHE")
	private readonly cacheService: CacheService;

	public getClient = async (config: Config): Promise<OutgoingClient> =>
		new Client(this.cacheService, config);
}
