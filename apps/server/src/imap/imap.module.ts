import { Module } from "@nestjs/common";

import { CacheModule } from "@src/cache/cache.module";

import { ImapService } from "./imap.service";

@Module({
	imports: [CacheModule],
	providers: [ImapService],
	exports: [ImapService]
})
export class ImapModule {}
