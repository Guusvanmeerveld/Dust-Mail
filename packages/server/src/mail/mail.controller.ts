import { Controller, Get, Headers, UseGuards } from "@nestjs/common";

import { AuthService } from "../auth/auth.service";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";

const BEARER_PREFIX = "Bearer ";

@Controller("mail")
export class MailController {
	constructor(private authService: AuthService) {}

	@Get("/")
	@UseGuards(JwtAuthGuard)
	async fetchMail(@Headers("authorization") authorization?: string) {
		const token = authorization.slice(BEARER_PREFIX.length);

		const connection = this.authService.findConnection(token);

		return await connection.openBox("INBOX").then(async () => {
			return await connection
				.search(["SEEN"], {
					bodies: ["HEADER", "TEXT"],
					markSeen: false
				})
				.then((results) => {
					const subjects = results.map((res) => {
						return res.parts.filter((part) => {
							return part.which === "HEADER";
						})[0].body.subject[0];
					});

					return subjects;
				});
		});
	}
}
