import { z } from "zod";

import useMailClient from "./useMailClient";
import useUser, { useCurrentUser, useModifyUser } from "./useUser";

import { useNavigate } from "react-router-dom";

import { VersionResponse } from "@dust-mail/typings";

import { LoginOptions } from "@models/login";

import { Result } from "@interfaces/result";

import useStore from "@utils/hooks/useStore";
import {
	createBaseError,
	createErrorFromUnknown,
	parseError
} from "@utils/parseError";

// TODO: Fix this mess of a file.

export const useMailLogin = (): ((
	config: z.infer<typeof LoginOptions>
) => Promise<Result<void>>) => {
	const appVersion = useStore((state) => state.appVersion);
	const setFetching = useStore((state) => state.setFetching);

	const isTauri: boolean = "__TAURI__" in window;

	const login = useLoginFromToken();

	const mailClient = useMailClient();

	return async (config) => {
		if (config.length < 1)
			return createBaseError({
				kind: "ConfigNotComplete",
				message: "Config is missing items"
			});

		// Show the fetching animation
		setFetching(true);

		if (!isTauri) {
			console.log("Checking if server version matches with client version...");

			const versionResponseResult = await mailClient
				.getVersion()
				.catch((error) => createBaseError(createErrorFromUnknown(error)));

			if (!versionResponseResult.ok) {
				return versionResponseResult;
			}

			const {
				version: serverVersion,
				type: serverVersionType
			}: VersionResponse = versionResponseResult.data;

			if (serverVersion != appVersion.title) {
				setFetching(false);

				return createBaseError({
					message: `Server and client versions did not match, server has version ${serverVersion} (${serverVersionType}) while client has version ${appVersion.title} (${appVersion.type})`,
					kind: "VersionMismatch"
				});
			}
		}

		console.log("Sending login request...");

		// Request the login token
		const loginResult = await mailClient
			.login(config)
			// If there was anything wrong with the request, catch it
			.catch(parseError);

		if (!loginResult.ok) {
			setFetching(false);

			return loginResult;
		}

		const incomingConfig = config.find(
			(item) => typeof item.clientType != "string" && item.clientType.incoming
		);

		login(loginResult.data, {
			username: incomingConfig?.username,
			redirectToDashboard: true,
			setAsDefault: true
		});

		setFetching(false);

		return { ok: true, data: undefined };
	};
};

const useLoginFromToken = (): ((
	token: string,
	options?: {
		username?: string;
		redirectToDashboard?: boolean;
		setAsDefault?: boolean;
	}
) => void) => {
	const modifyUser = useModifyUser();
	const [, setCurrentUser] = useCurrentUser();

	const user = useUser();

	const navigate = useNavigate();

	return (token, options) => {
		const username = options?.username ?? user?.username;

		if (!username) return;

		console.log("Successfully authorized with mail servers");

		modifyUser(username, { token, username });

		setCurrentUser(username);

		if (options?.redirectToDashboard) navigate(`/dashboard`);
	};
};

export default useLoginFromToken;
