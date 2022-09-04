import type { Request } from "@auth/interfaces/request.interface";

import { mailDefaultLimit, mailFetchLimit } from "./constants";
import { AddressValidationPipe } from "./pipes/address.pipe";

import type {
	Address,
	BoxResponse,
	FullIncomingMessage,
	IncomingMessage
} from "@dust-mail/typings";

import {
	BadRequestException,
	Body,
	Controller,
	Get,
	ParseBoolPipe,
	ParseIntPipe,
	Post,
	Query,
	Req,
	UseGuards
} from "@nestjs/common";

import { AccessTokenAuthGuard } from "@src/auth/jwt-auth.guard";

import handleError from "@utils/handleError";

// import { ThrottlerBehindProxyGuard } from "@utils/guards/throttler-proxy.guard";

@Controller("mail")
export class MailController {
	@Get("boxes")
	// @UseGuards(ThrottlerBehindProxyGuard)
	@UseGuards(AccessTokenAuthGuard)
	async fetchBoxes(@Req() req: Request): Promise<BoxResponse[]> {
		const client = req.user.incomingClient;

		return await client.getBoxes().catch(handleError);
	}

	@Get("box")
	// @UseGuards(ThrottlerBehindProxyGuard)
	@UseGuards(AccessTokenAuthGuard)
	async fetchBox(
		@Req() req: Request,
		@Query("limit", ParseIntPipe) limit: number,
		@Query("cursor", ParseIntPipe) page: number,
		@Query("box") box: string
	): Promise<IncomingMessage[]> {
		if (!limit) limit = mailDefaultLimit;

		if (!box) box = "INBOX";

		if (typeof box != "string") {
			throw new BadRequestException("`box` property must be a string");
		}

		if (limit < 0 || limit > mailFetchLimit) {
			throw new BadRequestException(
				`Limit can't be lower than 0 or greater than ${mailFetchLimit}`
			);
		}

		if (page < 0) {
			throw new BadRequestException("Page can't be lower than 0");
		}

		const client = req.user.incomingClient;

		const start = page * limit;
		const end = page * limit + limit - 1;

		return await client
			.getBoxMessages(box, {
				start,
				end
			})
			.then((messages) =>
				messages.map((message) => ({
					...message,
					id: Buffer.from(message.id, "utf-8").toString("base64")
				}))
			)
			.catch(handleError);
	}

	@Get("message")
	// @UseGuards(ThrottlerBehindProxyGuard)
	@UseGuards(AccessTokenAuthGuard)
	async fetchMessage(
		@Req() req: Request,
		@Query("markRead", ParseBoolPipe) markAsRead: boolean,
		@Query("id") id?: string,
		@Query("box") box?: string
	): Promise<FullIncomingMessage | void> {
		if (!id) throw new BadRequestException("Missing message `id` param");

		if (!box) throw new BadRequestException("Missing message `box` param");

		if (typeof id != "string" || typeof box != "string") {
			throw new BadRequestException("`id` or `box` property must be a string");
		}

		id = Buffer.from(id, "base64").toString("utf-8");

		const client = req.user.incomingClient;

		return await client.getMessage(id, box, markAsRead);
	}

	@Post("send")
	// @UseGuards(ThrottlerBehindProxyGuard)
	@UseGuards(AccessTokenAuthGuard)
	async sendMessage(
		@Req() req: Request,
		@Body("from", AddressValidationPipe) from: Address,
		@Body("to", AddressValidationPipe) to: Address | Address[],
		@Body("cc", AddressValidationPipe) cc: Address | Address[],
		@Body("bcc", AddressValidationPipe) bcc: Address | Address[],
		@Body("content") content: string,
		@Body("subject") subject: string
	): Promise<string> {
		if (Array.isArray(from)) {
			throw new BadRequestException("`from` property can't be an array");
		}

		if (!content)
			throw new BadRequestException("Missing message `content` param");

		if (!subject)
			throw new BadRequestException("Missing message `subject` param");

		if (typeof content != "string") {
			throw new BadRequestException("`content` property must be a string");
		}

		if (typeof subject != "string") {
			throw new BadRequestException("`subject` property must be a string");
		}

		const client = req.user.outgoingClient;

		await client
			.send({ from, to, cc, bcc, content, subject })
			.catch(handleError);

		return "sent";
	}
}
