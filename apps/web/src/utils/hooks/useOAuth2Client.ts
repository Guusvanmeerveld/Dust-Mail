import z from "zod";

import useFetchClient from "./useFetchClient";
import useSettings from "./useSettings";

import { OAuthState } from "@dust-mail/structures";

import OAuth2Client from "@interfaces/oauth2";
import { Result } from "@interfaces/result";

import { NotImplemented } from "@utils/defaultErrors";
import { createBaseError, createResultFromUnknown } from "@utils/parseError";
import parseZodOutput from "@utils/parseZodOutput";

const useGetPublicOAuthTokens = (): (() => Promise<
	Result<Record<string, string>>
>) => {
	const fetch = useFetchClient();

	return () =>
		fetch("/mail/oauth2/tokens")
			.then((response) => {
				if (!response.ok) {
					return response;
				}

				const output = z
					.record(z.string(), z.string())
					.safeParse(response.data);

				return parseZodOutput(output);
			})
			.catch(createResultFromUnknown);
};

const findProviderToken = (
	providerName: string,
	tokens: Record<string, string>
): [string, string] | null => {
	for (const [key, value] of Object.entries(tokens)) {
		const isProvider = providerName
			.toLowerCase()
			.includes(key.trim().toLowerCase());

		if (isProvider) return [value, key];
	}

	return null;
};

const useOAuth2Client = (): OAuth2Client => {
	const isTauri: boolean = "__TAURI__" in window;

	const getPublicTokens = useGetPublicOAuthTokens();

	const [settings] = useSettings();

	return {
		async getGrant(providerName, authUrl, tokenUrl, scopes) {
			const authUrlResult = z.string().url().safeParse(authUrl);

			const authUrlOutput = parseZodOutput(authUrlResult);

			if (!authUrlOutput.ok) {
				return authUrlOutput;
			}

			if (settings.httpServerUrl === null)
				return createBaseError({
					kind: "NoBackend",
					message: "Backend server url is not set"
				});

			const publicTokensResult = await getPublicTokens().catch(
				createResultFromUnknown
			);

			if (!publicTokensResult.ok) {
				return publicTokensResult;
			}

			const publicTokens = publicTokensResult.data;

			const providerDetails = findProviderToken(providerName, publicTokens);

			if (providerDetails === null)
				return createBaseError({
					kind: "NoOAuthToken",
					message:
						"Could not find a oauth token on remote Dust-Mail server to authorize with email provider"
				});

			const providerToken = providerDetails[0];
			const providerId = providerDetails[1];

			if (!isTauri) {
				if (typeof window !== "undefined" && "open" in window) {
					const url = new URL(authUrlOutput.data);
					const redirectUri = new URL(
						"/mail/oauth2/redirect",
						settings.httpServerUrl
					);

					const state: OAuthState = {
						provider: providerId,
						application: isTauri ? "desktop" : "web"
					};

					// https://www.rfc-editor.org/rfc/rfc6749#section-1.1
					url.searchParams.set("response_type", "code");
					url.searchParams.set("redirect_uri", redirectUri.toString());
					url.searchParams.set("client_id", providerToken);
					url.searchParams.set("scope", scopes.join(" "));
					url.searchParams.set("state", JSON.stringify(state));
					url.searchParams.set("access_type", "offline");

					const oauthLoginWindow = window.open(url, "_blank", "popup");

					if (oauthLoginWindow === null)
						return createBaseError({
							kind: "UnsupportedEnvironment",
							message:
								"Your browser environment does not support intercommunication between windows"
						});

					oauthLoginWindow.addEventListener("message", console.log);

					return { ok: true as const, data: "" };
				} else {
					return createBaseError({
						kind: "UnsupportedEnvironment",
						message:
							"Your browser environment does not support opening a new window"
					});
				}
			}

			return NotImplemented("oauth-grant-tauri");
		}
	};
};

export default useOAuth2Client;
