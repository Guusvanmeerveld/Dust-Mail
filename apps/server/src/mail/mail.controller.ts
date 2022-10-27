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
	Put,
	ParseBoolPipe,
	ParseIntPipe,
	Post,
	Query,
	Req,
	UseGuards,
	Delete
} from "@nestjs/common";

import handleError from "@utils/handleError";

import type { Request } from "@auth/interfaces/request.interface";
import { AccessTokenAuthGuard } from "@auth/jwt-auth.guard";
import { StringValidationPipe } from "@auth/pipes/string.pipe";

// import { ThrottlerBehindProxyGuard } from "@utils/guards/throttler-proxy.guard";

@Controller("mail")
export class MailController {
	@Get("folders")
	// @UseGuards(ThrottlerBehindProxyGuard)
	@UseGuards(AccessTokenAuthGuard)
	async fetchBoxes(@Req() req: Request): Promise<BoxResponse[]> {
		const client = req.user.incomingClient;

		return await client.getBoxes().catch(handleError);
	}

	@Get("folder")
	// @UseGuards(ThrottlerBehindProxyGuard)
	@UseGuards(AccessTokenAuthGuard)
	async fetchBox(
		@Req() req: Request,
		@Query("limit", ParseIntPipe) limit: number,
		@Query("cursor", ParseIntPipe) page: number,
		@Query("filter", StringValidationPipe) filter: string,
		@Query("folder", StringValidationPipe) box: string
	): Promise<IncomingMessage[]> {
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

		if (!filter) {
			filter = "";
		}

		const boxes = box.split(",");

		const client = req.user.incomingClient;

		const start = page * limit;
		const end = page * limit + limit - 1;

		return await client
			.getBoxMessages(boxes.shift(), {
				filter,
				start,
				end
			})
			.then((messages) =>
				messages
					.filter((msg) => msg.id != undefined)
					.map((message) => ({
						...message,
						date: new Date(message.date),
						id: Buffer.from(message.id, "utf-8").toString("base64")
					}))
			)
			.catch(handleError);

		// return allMessages
		// 	.flat()
		// 	.sort((a, b) => b.date.getTime() - a.date.getTime())
		// 	.slice(start, end);
	}

	@Put("folder/create")
	@UseGuards(AccessTokenAuthGuard)
	async createBox(
		@Req() req: Request,
		@Body("id", StringValidationPipe) boxID: string
	) {
		if (boxID == undefined) {
			throw new BadRequestException("Missing folder `id` param");
		}

		const client = req.user.incomingClient;

		await client.createBox(boxID).catch(handleError);

		return "created new folder";
	}

	@Delete("folder/delete")
	@UseGuards(AccessTokenAuthGuard)
	async deleteBox(
		@Req() req: Request,
		@Query("id", StringValidationPipe) boxIDs: string
	) {
		if (boxIDs == undefined) {
			throw new BadRequestException("Missing folder `id` param");
		}

		const client = req.user.incomingClient;

		await client.deleteBox(boxIDs.split(",")).catch(handleError);

		return "deleted folder";
	}

	@Put("folder/rename")
	@UseGuards(AccessTokenAuthGuard)
	async renameBox(
		@Req() req: Request,
		@Body("oldID", StringValidationPipe) oldBoxID: string,
		@Body("newID", StringValidationPipe) newBoxID: string
	) {
		if (oldBoxID == undefined) {
			throw new BadRequestException("Missing `oldID` param");
		}

		if (newBoxID == undefined) {
			throw new BadRequestException("Missing `newID` param");
		}

		const client = req.user.incomingClient;

		await client.renameBox(oldBoxID, newBoxID).catch(handleError);

		return `renamed folder from ${oldBoxID} to ${newBoxID}`;
	}

	@Get("message")
	// @UseGuards(ThrottlerBehindProxyGuard)
	@UseGuards(AccessTokenAuthGuard)
	async fetchMessage(
		@Req() req: Request,
		@Query("markRead", ParseBoolPipe) markAsRead: boolean,
		@Query("noImages", ParseBoolPipe) noImages: boolean,
		@Query("darkMode", ParseBoolPipe) darkMode: boolean,
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

		return await client.getMessage(id, box, markAsRead, noImages, darkMode);
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
		if (!from) {
			throw new BadRequestException("Missing message `from` param");
		}

		if (!to) {
			throw new BadRequestException("Missing message `to` param");
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

		await client.disconnect();

		return "sent";
	}
}
