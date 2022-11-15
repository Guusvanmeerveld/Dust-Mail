import { CryptoService } from "./crypto.service";

import { Module } from "@nestjs/common";

@Module({
	providers: [CryptoService],
	exports: [CryptoService]
})
export class CryptoModule {}
