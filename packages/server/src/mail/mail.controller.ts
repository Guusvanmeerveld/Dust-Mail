import {
	BadRequestException,
	Controller,
	Get,
	ParseIntPipe,
	Query,
	Req,
	UseGuards
} from "@nestjs/common";

import { ImapSimple } from "imap-simple";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";

import { mailFetchLimit } from "./constants";

@Controller("mail")
export class MailController {
	@Get("/")
	@UseGuards(JwtAuthGuard)
	async fetchMail(@Req() req, @Query("limit", ParseIntPipe) limit: number) {
		if (limit < 0 || limit > mailFetchLimit) {
			throw new BadRequestException(
				`Limit can't be lower than 0 or greater than ${mailFetchLimit}`
			);
		}

		const connection: ImapSimple = req.user.connection;

		return await connection.openBox("INBOX").then(async () => {
			const results = await connection
				.search([`1:${limit}`], {
					bodies: ["HEADER"],
					markSeen: false
				})
				.then((results) => {
					const subjects = results.map((res) => {
						return res.parts.filter((part) => {
							return part.which === "HEADER";
						})[0].body;
					});

					return subjects;
				});

			await connection.closeBox(false);

			return results;
		});
	}
}
