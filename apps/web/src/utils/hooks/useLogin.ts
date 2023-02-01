import { z } from "zod";

import useMailClient from "./useMailClient";
import useUser, { useCurrentUser, useModifyUser } from "./useUser";

import { useNavigate } from "react-router-dom";

import { VersionResponse } from "@dust-mail/typings";

import { Error as ErrorModel } from "@models/error";
import { LoginOptions } from "@models/login";

import useStore from "@utils/hooks/useStore";

// TODO: Fix this mess of a file.

export const useMailLogin = (): ((
	config: z.infer<typeof LoginOptions>
) => Promise<void>) => {
	const appVersion = useStore((state) => state.appVersion);
	const setFetching = useStore((state) => state.setFetching);

	const isTauri: boolean = "__TAURI__" in window;

	const login = useLoginFromToken();

	const mailClient = useMailClient();

	return async (config) => {
		if (config.length < 1) return;

		// Show the fetching animation
		setFetching(true);

		if (!isTauri) {
			console.log("Checking if server version matches with client version...");

			const versionResponse = await mailClient
				.getVersion()
				.catch((e: z.infer<typeof ErrorModel>) => {
					setFetching(false);

					throw e;
				});

			if (!versionResponse) return;

			const {
				version: serverVersion,
				type: serverVersionType
			}: VersionResponse = versionResponse;

			if (serverVersion != appVersion.title) {
				setFetching(false);

				throw {
					message: `Server and client versions did not match, server has version ${serverVersion} (${serverVersionType}) while client has version ${appVersion.title} (${appVersion.type})`,
					kind: "VersionMismatch"
				};
			}
		}

		console.log("Sending login request...");

		// Request the login token
		const data = await mailClient
			.login(config)
			// If there was anything wrong with the request, catch it
			.catch((error: z.infer<typeof ErrorModel>) => {
				// Hide the fetching animation
				setFetching(false);

				console.log("An error occured when requesting the login token");

				throw error;
			});

		const incomingConfig = config.find(
			(item) => typeof item.clientType != "string" && item.clientType.incoming
		);

		if (!incomingConfig) return;

		login(data, {
			username: incomingConfig.username,
			redirectToDashboard: true,
			setAsDefault: true
		});

		setFetching(false);
	};
};

const useLoginFromToken = (): ((
	token: string,
	options?: {
		username?: string;
		redirectToDashboard?: boolean;
		setAsDefault?: boolean;
	}
) => Promise<void>) => {
	const modifyUser = useModifyUser();
	const [, setCurrentUser] = useCurrentUser();

	const user = useUser();

	const navigate = useNavigate();

	return async (token, options) => {
		const username = options?.username ?? user?.username;

		if (!username) return;

		console.log("Successfully authorized with mail servers");

		modifyUser(username, { token, username });

		setCurrentUser(username);

		if (options?.redirectToDashboard) navigate(`/dashboard`);
	};
};

export default useLoginFromToken;
