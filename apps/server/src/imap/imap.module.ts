import { ImapService } from "./imap.service";

import { Module } from "@nestjs/common";

import { CacheModule } from "@src/cache/cache.module";

@Module({
	imports: [CacheModule],
	providers: [ImapService],
	exports: [ImapService]
})
export class ImapModule {}
