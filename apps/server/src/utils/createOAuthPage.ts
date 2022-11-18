import * as cheerio from "cheerio";
import crypto from "crypto";
import { readFile } from "fs-extra";
import { join } from "path";

import createTokenResponse from "./createTokenResponse";

import { BadRequestException } from "@nestjs/common";

const pathToOAuthPage = join(process.cwd(), "public", "oauth.html");
const pathToOAuthScript = join(process.cwd(), "public", "oauth.js");

const hostnameMatch = /\w+:\/\/\w+(:[0-9]+)?/g;

const createOAuthPage = async (
	accessToken: string,
	refreshToken: string,
	username: string,
	clientHostname: string
): Promise<[string, string]> => {
	if (!hostnameMatch.test(clientHostname))
		throw new BadRequestException("Invalid hostname provided");

	const tokens = {
		access: createTokenResponse("access", accessToken),
		refresh: createTokenResponse("refresh", refreshToken)
	};

	const oauthPage = await readFile(pathToOAuthPage);

	const $ = cheerio.load(oauthPage);

	const oauthScript = await readFile(pathToOAuthScript).then((script) =>
		script
			.toString()
			.replace("{{access_token}}", JSON.stringify(tokens.access))
			.replace("{{refresh_token}}", JSON.stringify(tokens.refresh))
			.replace("{{username}}", username)
			.replace("{{clientHostname}}", clientHostname)
			.replace(
				`"{{isTauri}}"`,
				clientHostname == "tauri://localhost" ? "true" : "false"
			)
	);

	$("body").append(`<script>${oauthScript}</script>`);

	const hash = crypto.createHash("sha256").update(oauthScript).digest("base64");

	return [$.html(), `sha256-${hash}`];
};

export default createOAuthPage;
