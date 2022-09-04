import { AvatarController } from "./avatar.controller";
import { AvatarService } from "./avatar.service";

import { CacheModule, Module } from "@nestjs/common";

@Module({
	imports: [CacheModule.register({ ttl: 3600 })],
	controllers: [AvatarController],
	providers: [AvatarService]
})
export class AvatarModule {}
