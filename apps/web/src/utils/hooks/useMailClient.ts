import { invoke } from "@tauri-apps/api/tauri";
import z from "zod";

import useFetchClient from "./useFetchClient";
import useUser from "./useUser";

import {
	CredentialsModel,
	MailBoxListModel,
	MailBoxModel,
	MailConfigModel,
	MessageModel,
	PreviewModel,
	VersionModel
} from "@dust-mail/structures";

import { messageCountForPage } from "@src/constants";

import MailClient from "@interfaces/client";

import { MissingRequiredParam, NotLoggedIn } from "@utils/defaultErrors";
import parseEmail from "@utils/parseEmail";
import {
	createBaseError,
	createResultFromUnknown,
	parseError
} from "@utils/parseError";
import parseZodOutput from "@utils/parseZodOutput";

const useMailClient = (): MailClient => {
	const isTauri: boolean = "__TAURI__" in window;

	const user = useUser();

	const fetch = useFetchClient();

	return {
		async getVersion() {
			if (isTauri) {
				return createBaseError({
					message: "Version check is not needed in Tauri application",
					kind: "Unsupported"
				});
			}

			return fetch("/version", {
				method: "GET",
				useMailSessionToken: false,
				sendAuth: false
			})
				.then((response) => {
					if (!response.ok) {
						return response;
					}

					const output = VersionModel.safeParse(response.data);

					return parseZodOutput(output);
				})
				.catch(createResultFromUnknown);
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
						const output = MailConfigModel.safeParse(data);

						return parseZodOutput(output);
					})
					.catch(parseError);
			}

			return fetch(`/detect/${emailAddress}`, {
				method: "GET",
				useMailSessionToken: false
			})
				.then((response) => {
					if (!response.ok) {
						return response;
					}

					const output = MailConfigModel.safeParse(response.data);

					return parseZodOutput(output);
				})
				.catch(createResultFromUnknown);
		},
		async login(options) {
			const optionsResult = parseZodOutput(CredentialsModel.safeParse(options));

			if (!optionsResult.ok) {
				return optionsResult;
			}

			if (isTauri) {
				return invoke("login", { credentials: optionsResult.data })
					.then((data: unknown) => {
						const output = z.string().safeParse(data);

						return parseZodOutput(output);
					})
					.catch(parseError);
			}

			return fetch(`/mail/login`, {
				method: "POST",
				body: JSON.stringify(optionsResult.data),
				useMailSessionToken: false
			})
				.then((response) => {
					if (!response.ok) {
						return response;
					}

					const output = z.string().safeParse(response.data);

					return parseZodOutput(output);
				})
				.catch(createResultFromUnknown);
		},
		async logout() {
			const okResponse = { ok: true, data: undefined } as const;

			if (isTauri) {
				const token = user?.token;

				return invoke("logout", { token })
					.then(() => okResponse)
					.catch(parseError);
			}

			return fetch("/mail/logout", { method: "POST" })
				.then((response) => {
					if (!response.ok) {
						return response;
					}

					return okResponse;
				})
				.catch(createResultFromUnknown);
		},
		async get(boxId) {
			if (boxId === undefined) return MissingRequiredParam();

			if (isTauri) {
				const token = user?.token;

				if (token === undefined) return NotLoggedIn();

				return invoke("get", { token, boxId })
					.then((data: unknown) => {
						const output = MailBoxModel.safeParse(data);

						return parseZodOutput(output);
					})
					.catch(parseError);
			}

			return fetch(`/mail/boxes/${boxId}`)
				.then((response) => {
					if (!response.ok) {
						return response;
					}

					const output = MailBoxModel.safeParse(response.data);

					return parseZodOutput(output);
				})
				.catch(createResultFromUnknown);
		},
		async list() {
			if (isTauri) {
				const token = user?.token;

				if (!token) return NotLoggedIn();

				return invoke("list", { token })
					.then((data: unknown) => {
						const output = MailBoxListModel.safeParse(data);

						return parseZodOutput(output);
					})
					.catch(parseError);
			}

			return fetch("/mail/boxes/list")
				.then((response) => {
					if (!response.ok) {
						return response;
					}

					const output = MailBoxListModel.safeParse(response.data);

					return parseZodOutput(output);
				})
				.catch(createResultFromUnknown);
		},
		async messageList(page, boxId) {
			if (!boxId) return MissingRequiredParam();

			const start = page * messageCountForPage;
			const end = page * messageCountForPage + messageCountForPage;

			if (isTauri) {
				const token = user?.token;

				if (!token) return NotLoggedIn();

				return invoke("messages", { token, boxId, start, end })
					.then((data: unknown) => {
						const output = PreviewModel.array().safeParse(data);

						return parseZodOutput(output);
					})
					.catch(parseError);
			}

			return fetch(`/mail/boxes/${boxId}/messages`, {
				params: { start: start.toString(), end: end.toString() }
			})
				.then((response) => {
					if (!response.ok) {
						return response;
					}

					const output = PreviewModel.array().safeParse(response.data);

					return parseZodOutput(output);
				})
				.catch(createResultFromUnknown);
		},
		async getMessage(messageId, boxId) {
			if (!boxId || !messageId) return MissingRequiredParam();

			if (isTauri) {
				const token = user?.token;

				if (!token) return NotLoggedIn();

				return invoke("get_message", { token, boxId, messageId })
					.then((data: unknown) => {
						const output = MessageModel.safeParse(data);

						return parseZodOutput(output);
					})
					.catch(parseError);
			}

			return fetch(`/mail/boxes/${boxId}/${messageId}`)
				.then((response) => {
					if (!response.ok) {
						return response;
					}

					const output = MessageModel.safeParse(response.data);

					return parseZodOutput(output);
				})
				.catch(createResultFromUnknown);
		}
	};
};

export default useMailClient;
