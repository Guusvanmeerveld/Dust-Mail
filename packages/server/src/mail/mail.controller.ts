import {
	BadRequestException,
	Controller,
	Get,
	ParseIntPipe,
	Query,
	Req,
	UseGuards
} from "@nestjs/common";

import { JwtAuthGuard } from "@auth/jwt-auth.guard";

import { mailDefaultLimit, mailFetchLimit } from "./constants";

import { Request } from "@auth/interfaces/request.interface";
import handleError from "@utils/handleError";

@Controller("mail")
export class MailController {
	@Get("/boxes")
	@UseGuards(JwtAuthGuard)
	async fetchBoxes(@Req() req: Request) {
		const client = req.user.client;

		return await client.getBoxes().catch(handleError);
	}

	@Get("/box")
	@UseGuards(JwtAuthGuard)
	async fetchBox(
		@Req() req: Request,
		@Query("limit", ParseIntPipe) limit: number,
		@Query("cursor", ParseIntPipe) page: number,
		@Query("box") box: string
	) {
		if (!limit) limit = mailDefaultLimit;

		if (!box) box = "INBOX";

		if (limit < 0 || limit > mailFetchLimit) {
			throw new BadRequestException(
				`Limit can't be lower than 0 or greater than ${mailFetchLimit}`
			);
		}

		if (page < 0) {
			throw new BadRequestException("Page can't be lower than 0");
		}

		const client = req.user.client;

		const start = page * limit;
		const end = page * limit + limit - 1;

		return await client
			.getBoxMessages(box, {
				start,
				end
			})
			.catch(handleError);
	}

	@Get("/message")
	@UseGuards(JwtAuthGuard)
	async fetchMessage(
		@Req() req: Request,
		@Query("id") id?: string,
		@Query("box") box?: string
	) {
		if (!id) throw new BadRequestException("Missing message `id` param");

		if (!box) throw new BadRequestException("Missing message `box` param");

		const client = req.user.client;

		return await client.getMessage(id, box).catch(handleError);
	}
}
