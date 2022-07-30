import { CacheModule, Module } from "@nestjs/common";

import { AvatarController } from "./avatar.controller";
import { AvatarService } from "./avatar.service";

@Module({
	imports: [CacheModule.register({ ttl: 3600 })],
	controllers: [AvatarController],
	providers: [AvatarService]
})
export class AvatarModule {}
