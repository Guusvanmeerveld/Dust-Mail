import {
	CacheInterceptor,
	Controller,
	Get,
	Query,
	UseGuards,
	UseInterceptors
} from "@nestjs/common";

import { MailValidationPipe } from "@auth/pipes/mail.pipe";
import { JwtAuthGuard } from "@auth/jwt-auth.guard";

import { AvatarService } from "./avatar.service";

@Controller("avatar")
export class AvatarController {
	constructor(private readonly avatarService: AvatarService) {}

	@Get("/")
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(CacheInterceptor)
	async findAvatarForAddress(
		@Query("address", MailValidationPipe) address: string
	): Promise<string> {
		const stream = await this.avatarService.createAvatar(address);

		return new Promise((resolve, reject) => {
			const result: Buffer[] = [];

			stream.on("data", (chunk: Buffer) => result.push(chunk));

			stream.on("end", () =>
				resolve(
					"data:image/png;base64," + Buffer.concat(result).toString("base64")
				)
			);

			stream.on("error", reject);
		});
	}
}
