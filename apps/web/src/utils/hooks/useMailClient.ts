import { invoke } from "@tauri-apps/api/tauri";
import z from "zod";

import useUser from "./useUser";

import { messageCountForPage } from "@src/constants";

import { MailConfig } from "@models/config";
import { LoginOptions } from "@models/login";
import { MailBox, MailBoxList } from "@models/mailbox";
import { Message } from "@models/message";
import { Preview } from "@models/preview";

import MailClient from "@interfaces/client";
import { Error } from "@interfaces/result";

import parseEmail from "@utils/parseEmail";
import { createBaseError, parseError } from "@utils/parseError";
import parseZodOutput from "@utils/parseZodOutput";

const NotLoggedIn = (): Error =>
	createBaseError({
		kind: "NotLoggedIn",
		message: "Could not find session token in local storage"
	});

const NotImplemented = (): Error =>
	createBaseError({
		kind: "NotImplemented",
		message: "This feature is not yet implemented"
	});

const MissingRequiredParam = (): Error =>
	createBaseError({
		kind: "MissingRequiredParam",
		message: "Missing a required parameter"
	});

const useMailClient = (): MailClient => {
	const isTauri: boolean = "__TAURI__" in window;

	const user = useUser();

	return {
		async getVersion() {
			if (isTauri) {
				return createBaseError({
					message: "Version check is not needed in Tauri application",
					kind: "Unsupported"
				});
			}

			return NotImplemented();
		},
		async detectConfig(emailAddress) {
			const emailAddressParsed = parseEmail(emailAddress);

			if (!emailAddressParsed.ok) {
				return emailAddressParsed;
			}

			emailAddress = emailAddressParsed.data.full;

			if (isTauri) {
				return invoke("detect_config", { emailAddress })
					.then((data: unknown) => {
						const output = MailConfig.safeParse(data);

						return parseZodOutput(output);
					})
					.catch(parseError);
			}

			return NotImplemented();
		},
		async login(options) {
			const optionsResult = parseZodOutput(LoginOptions.safeParse(options));

			if (!optionsResult.ok) {
				return optionsResult;
			}

			if (isTauri) {
				return invoke("login", { options: optionsResult.data })
					.then((data: unknown) => {
						const output = z.string().safeParse(data);

						return parseZodOutput(output);
					})
					.catch(parseError);
			}

			return NotImplemented();
		},
		async get(boxId) {
			const token = user?.token;

			if (token === undefined) return NotLoggedIn();

			if (boxId === undefined) return MissingRequiredParam();

			if (isTauri) {
				return invoke("get", { token, boxId })
					.then((data: unknown) => {
						const output = MailBox.safeParse(data);

						return parseZodOutput(output);
					})
					.catch(parseError);
			}

			return NotImplemented();
		},
		async list() {
			const token = user?.token;

			if (!token) return NotLoggedIn();

			if (isTauri) {
				return invoke("list", { token })
					.then((data: unknown) => {
						const output = MailBoxList.safeParse(data);

						return parseZodOutput(output);
					})
					.catch(parseError);
			}

			return NotImplemented();
		},
		async messageList(page, boxId) {
			const token = user?.token;

			if (!token) return NotLoggedIn();

			if (!boxId) return MissingRequiredParam();

			const start = page * messageCountForPage;
			const end = page * messageCountForPage + messageCountForPage;

			if (isTauri) {
				return invoke("messages", { token, boxId, start, end })
					.then((data: unknown) => {
						const output = Preview.array().safeParse(data);

						return parseZodOutput(output);
					})
					.catch(parseError);
			}

			return NotImplemented();
		},
		async getMessage(messageId, boxId) {
			const token = user?.token;

			if (!token) return NotLoggedIn();

			if (!boxId || !messageId) return MissingRequiredParam();

			if (isTauri) {
				return invoke("get_message", { token, boxId, messageId })
					.then((data: unknown) => {
						const output = Message.safeParse(data);

						return parseZodOutput(output);
					})
					.catch(parseError);
			}

			return NotImplemented();
		}
	};
};

export default useMailClient;
