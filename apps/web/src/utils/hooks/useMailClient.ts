import { invoke } from "@tauri-apps/api/tauri";
import z from "zod";

import useUser from "./useUser";

import { messageCountForPage } from "@src/constants";

import { MailConfig } from "@models/config";
import { Error } from "@models/error";
import { LoginOptions } from "@models/login";
import { MailBox, MailBoxList } from "@models/mailbox";
import { Message } from "@models/message";
import { Preview } from "@models/preview";

import MailClient from "@interfaces/client";

import parseZodOutput from "@utils/parseZodOutput";

const NotLoggedIn: z.infer<typeof Error> = {
	kind: "NotLoggedIn",
	message: "Could not find session token in local storage"
};

const NotImplemented: z.infer<typeof Error> = {
	kind: "NotImplemented",
	message: "This feature is not yet implemented"
};

const MissingRequiredParam: z.infer<typeof Error> = {
	kind: "MissingRequiredParam",
	message: "Missing a required parameter"
};

const useMailClient = (): MailClient => {
	const isTauri: boolean = "__TAURI__" in window;

	const user = useUser();

	return {
		getVersion() {
			if (isTauri) {
				throw {
					message: "Version check is not needed in Tauri application",
					kind: "Unsupported"
				};
			}

			throw NotImplemented;
		},
		async detectConfig(emailAddress) {
			const { success: isEmailAddress } = z
				.string()
				.email()
				.safeParse(emailAddress);

			if (!isEmailAddress)
				throw { message: "Email address is invalid", kind: "InvalidInput" };

			if (isTauri) {
				return invoke("detect_config", { emailAddress })
					.catch((error: unknown) => {
						const output = Error.safeParse(error);

						throw parseZodOutput(output);
					})
					.then((data: unknown) => {
						const output = MailConfig.safeParse(data);

						return parseZodOutput(output);
					});
			}

			throw NotImplemented;
		},
		async login(options) {
			options = LoginOptions.parse(options);

			if (isTauri) {
				return invoke("login", { options })
					.catch((error: unknown) => {
						const output = Error.safeParse(error);

						throw parseZodOutput(output);
					})
					.then((data: unknown) => {
						const output = z.string().safeParse(data);

						return parseZodOutput(output);
					});
			}

			throw NotImplemented;
		},
		async get(boxId) {
			const token = user?.token;

			if (!token) throw NotLoggedIn;

			if (!boxId) throw MissingRequiredParam;

			if (isTauri) {
				return invoke("get", { token, boxId })
					.catch((error: unknown) => {
						const output = Error.safeParse(error);

						throw parseZodOutput(output);
					})
					.then((data: unknown) => {
						const output = MailBox.safeParse(data);

						return parseZodOutput(output);
					});
			}

			throw NotImplemented;
		},
		async list() {
			const token = user?.token;

			if (!token) throw NotLoggedIn;

			if (isTauri) {
				return invoke("list", { token })
					.catch((error: unknown) => {
						const output = Error.safeParse(error);

						throw parseZodOutput(output);
					})
					.then((data: unknown) => {
						const output = MailBoxList.safeParse(data);

						return parseZodOutput(output);
					});
			}

			throw NotImplemented;
		},
		async messageList(page, boxId) {
			const token = user?.token;

			if (!token) throw NotLoggedIn;

			if (!boxId) throw MissingRequiredParam;

			const start = page * messageCountForPage;
			const end = page * messageCountForPage + messageCountForPage;

			if (isTauri) {
				return invoke("messages", { token, boxId, start, end })
					.catch((error: unknown) => {
						const output = Error.safeParse(error);

						throw parseZodOutput(output);
					})
					.then((data: unknown) => {
						const output = Preview.array().safeParse(data);

						return parseZodOutput(output);
					});
			}

			throw NotImplemented;
		},
		async getMessage(messageId, boxId) {
			const token = user?.token;

			if (!token) throw NotLoggedIn;

			if (!boxId || !messageId) throw MissingRequiredParam;

			if (isTauri) {
				return invoke("get_message", { token, boxId, messageId })
					.catch((error: unknown) => {
						console.log(error);
						const output = Error.safeParse(error);

						throw parseZodOutput(output);
					})
					.then((data: unknown) => {
						const output = Message.safeParse(data);

						return parseZodOutput(output);
					});
			}

			throw NotImplemented;
		}
	};
};

export default useMailClient;
