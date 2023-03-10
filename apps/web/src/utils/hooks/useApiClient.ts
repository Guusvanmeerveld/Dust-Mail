import { z } from "zod";

import { version } from "../../../package.json";
import useFetchClient from "./useFetchClient";

import { ApiSettingsModel } from "@dust-mail/structures";

import ApiClient from "@interfaces/api";

import { createBaseError, createResultFromUnknown } from "@utils/parseError";
import parseZodOutput from "@utils/parseZodOutput";

const useApiClient = (): ApiClient => {
	const fetch = useFetchClient();

	return {
		async getChangelog() {
			const response = await window
				.fetch(
					`https://raw.githubusercontent.com/${
						import.meta.env.VITE_REPO
					}/${version}/CHANGELOG.md`,
					{ method: "GET" }
				)
				.then((response) => response.text())
				.then((data) => ({ ok: true as const, data }))
				.catch((error) => {
					return createBaseError({
						kind: "GithubError",
						message: JSON.stringify(error)
					});
				});

			return response;
		},
		async getSettings(baseUrl?: string) {
			return await fetch("/settings", {
				baseUrl,
				method: "GET",
				sendAuth: false,
				useMailSessionToken: false
			})
				.then((response) => {
					if (!response.ok) {
						return response;
					}

					const output = ApiSettingsModel.safeParse(response.data);

					return parseZodOutput(output);
				})
				.catch(createResultFromUnknown);
		},
		async login(baseUrl, password, username) {
			const formData = new FormData();

			if (password !== undefined) formData.append("password", password);
			if (username !== undefined) formData.append("username", username);

			return await fetch("/login", {
				method: "POST",
				contentType: "none",
				baseUrl,
				useMailSessionToken: false,
				body: formData
			})
				.then((response) => {
					if (!response.ok) {
						return response;
					}

					const output = z.string().safeParse(response.data);

					const parsedOutput = parseZodOutput(output);

					if (!parsedOutput.ok) {
						return parsedOutput;
					}

					return { ...parsedOutput, data: undefined };
				})
				.catch(createResultFromUnknown);
		}
	};
};

export default useApiClient;
