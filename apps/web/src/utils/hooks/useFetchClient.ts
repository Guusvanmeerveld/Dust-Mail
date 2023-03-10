import useSettings from "./useSettings";
import useUser from "./useUser";

import { ApiResponseModel } from "@dust-mail/structures";

import { Result } from "@interfaces/result";

import { createBaseError, parseError } from "@utils/parseError";
import parseJsonAsync from "@utils/parseJson";
import parseZodOutput from "@utils/parseZodOutput";

type FetchFunction = (
	url: string,
	config?: {
		body?: BodyInit;
		params?: Record<string, string>;
		baseUrl?: string;
		method?: "POST" | "GET" | "DELETE" | "PUT";
		sendAuth?: boolean;
		useMailSessionToken?: boolean;
		contentType?: "json" | "form" | "none";
	}
) => Promise<Result<unknown>>;

const useFetchClient = (): FetchFunction => {
	const [settings] = useSettings();

	const user = useUser();

	const httpServerUrl = settings.httpServerUrl;

	const fetch: FetchFunction = async (path, config) => {
		const backendUrl = config?.baseUrl ?? httpServerUrl;

		if (backendUrl == null) {
			return createBaseError({
				kind: "NoBackendUrl",
				message: "Backend url for api server is not set"
			});
		}

		const url = new URL(path, backendUrl);

		if (config?.params !== undefined)
			Object.entries(config.params).forEach(([key, value]) => {
				url.searchParams.set(key, value);
			});

		if (config?.useMailSessionToken !== false && user?.token !== undefined)
			url.searchParams.set("session_token", user.token);

		if (typeof window === "undefined" || !("fetch" in window)) {
			return createBaseError({
				kind: "FetchUnsupported",
				message: "The fetch api is not supported in this environment"
			});
		}

		const headers = new Headers();

		if (config?.contentType === "form") {
			headers.append("Content-Type", "application/x-www-form-urlencoded");
		} else if (config?.contentType !== "none") {
			headers.append("Content-Type", "application/json");
		}

		return await window
			.fetch(url.toString(), {
				body: config?.body,
				method: config?.method ?? "GET",
				credentials: config?.sendAuth !== false ? "include" : "omit",
				referrerPolicy: "no-referrer",
				headers
			})
			.then(async (response) => {
				const responseString = await response.text().catch(() => null);

				if (responseString === null)
					return createBaseError({
						kind: "InvalidResponseBody",
						message: "Invalid response body from server response"
					});

				return await parseJsonAsync(responseString)
					.then((parsedOutput) => {
						const parseOutputResult = ApiResponseModel.safeParse(parsedOutput);

						const parsedZodOutput = parseZodOutput(parseOutputResult);

						if (parsedZodOutput.ok) {
							const serverResponseResult = parsedZodOutput.data;

							// We have to do this ugly little workaround because the zod unknown parser returns an optional unknown in its ts type.
							// See https://github.com/colinhacks/zod/issues/493
							if (serverResponseResult.ok) {
								return {
									...serverResponseResult,
									data: serverResponseResult.data as unknown
								};
							} else {
								return serverResponseResult;
							}
						} else {
							return parsedZodOutput;
						}
					})
					.catch((error: string) =>
						createBaseError({ kind: "ParseJSON", message: error })
					);
			})
			.catch(parseError);
	};

	return fetch;
};

export default useFetchClient;
