import { createReadStream } from "fs";
import { join } from "path";

import axios from "axios";

import { Readable } from "stream";

import { Injectable, NotFoundException } from "@nestjs/common";

import { createHash } from "@utils/createHash";

import { avatars } from "./constants";

@Injectable()
export class AvatarService {
	private createGravatarUrl = (email: string) =>
		`https://www.gravatar.com/avatar/${createHash(
			email.trim().toLowerCase()
		)}.png?d=404&size=80`;

	private readonly avatars = avatars;

	public createAvatar = async (email: string): Promise<Readable> => {
		const preDefinedAvatar = this.avatars.find((item) =>
			email.match(item.address)
		);

		if (preDefinedAvatar)
			return createReadStream(
				join(
					process.cwd(),
					"public",
					"assets",
					preDefinedAvatar.avatar + ".png"
				)
			);

		const gravatarUrl = this.createGravatarUrl(email);

		const data = await axios
			.get<Readable>(gravatarUrl, {
				responseType: "stream",
				headers: {
					Accept: "image/png"
				}
			})
			.then((res) => res.data)
			.catch(() => {
				return;
			});

		if (data) return data;

		throw new NotFoundException();
	};
}
