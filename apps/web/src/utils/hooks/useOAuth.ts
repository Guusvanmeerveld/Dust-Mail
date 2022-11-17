import { WebviewWindow } from "@tauri-apps/api/window";
import useLocalStorageState from "use-local-storage-state";

import useFetch from "./useFetch";
import useLogin from "./useLogin";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";

import { PublicTokensResponse } from "@dust-mail/typings";

import { OAuthLoginResponse } from "@interfaces/oauth";

const oauthWindowLabel = "oauth2-login";

export const useWebOAuth = (): ((oauthLink: string) => void) => {
	const [webWindow, setWebWindow] = useState<Window>();

	const [backendServer] = useLocalStorageState("customServerUrl");

	const login = useLogin();

	const onWebWindowMessage = async (e: MessageEvent<string>): Promise<void> => {
		if (e.origin != backendServer) return;

		webWindow?.close();

		setWebWindow(undefined);

		const { username, tokens: config }: OAuthLoginResponse = JSON.parse(e.data);

		await login(config, {
			redirectToDashboard: true,
			username
		});
	};

	useEffect(() => {
		window.addEventListener("message", onWebWindowMessage);

		return () => window.removeEventListener("message", onWebWindowMessage);
	}, [webWindow]);

	return (oauthLink) => {
		const webview = window.open(
			oauthLink,
			oauthWindowLabel,
			"height=200,width=150"
		);

		if (webview === null) return;

		setWebWindow(webview);
	};
};

export const useTauriOAuth = (): ((oauthLink: string) => void) => {
	const [token, setToken] = useState<OAuthLoginResponse>();

	const login = useLogin();

	return async (url: string) => {
		const webview = new WebviewWindow(oauthWindowLabel, {
			url,
			focus: true,
			minWidth: 200,
			minHeight: 300
		});

		const unlisten = await webview.listen<OAuthLoginResponse>(
			"oauth_login_token",
			(e) => {
				setToken(e.payload);
			}
		);

		unlisten();

		// await webview.close();

		if (token) {
			const { username, tokens: config } = token;

			await login(config, {
				redirectToDashboard: true,
				username
			});
		}
	};
};

export const useGoogleOAuthLink = (username?: string): string | undefined => {
	const [backendServer] = useLocalStorageState("customServerUrl");

	const fetcher = useFetch();

	const { data: oauthTokens } = useQuery<PublicTokensResponse>(
		["oauthTokens", backendServer],
		() => fetcher.getPublicOAuthTokens(),
		{ retry: 1 }
	);

	const googleOAuthLink = useMemo(() => {
		if (!oauthTokens?.google) return;

		const params: Record<string, string> = {
			response_type: "code",
			access_type: "offline",
			approval_prompt: "force",
			scope: [
				"https://mail.google.com/",
				"https://www.googleapis.com/auth/userinfo.profile",
				"https://www.googleapis.com/auth/userinfo.email"
			].join(" "),
			login_hint: username ?? "",
			client_id: oauthTokens.google,
			redirect_uri: `${backendServer}/google/login`
		};

		return `https://accounts.google.com/o/oauth2/v2/auth?${Object.entries(
			params
		)
			.map(([key, value]) => `${key}=${value}`)
			.join("&")}`;
	}, [oauthTokens?.google, backendServer, username]);

	return googleOAuthLink;
};
