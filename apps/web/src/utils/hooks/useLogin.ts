import useMailClient from "./useMailClient";
import useUser, { useCurrentUser, useModifyUser } from "./useUser";

import { useNavigate } from "react-router-dom";

import {
	Credentials,
	LoginOptions,
	ServerType,
	Version
} from "@dust-mail/structures";

import { Result } from "@interfaces/result";

import useStore from "@utils/hooks/useStore";
import {
	createBaseError,
	createErrorFromUnknown,
	parseError
} from "@utils/parseError";

// TODO: Fix this mess of a file.

const findUsernameInLoginOptions = (loginOptions: LoginOptions): string => {
	return (
		loginOptions.loginType.oAuthBased?.username ??
		loginOptions.loginType.passwordBased?.username ??
		// Should never occur, but just in case it does happen there will be a fallback
		"test@example.com"
	);
};

const createIdentifier = (
	incomingConfig: LoginOptions,
	outgoingConfig: LoginOptions
): string => {
	const incomingUsername = findUsernameInLoginOptions(incomingConfig);
	const outgoingUsername = findUsernameInLoginOptions(outgoingConfig);

	const identifier = btoa(
		`${incomingUsername}@${incomingConfig.domain}|${outgoingUsername}@${outgoingConfig.domain}`
	);

	return identifier;
};

export const useMailLogin = (): ((
	config: Credentials
) => Promise<Result<void>>) => {
	const appVersion = useStore((state) => state.appVersion);
	const setFetching = useStore((state) => state.setFetching);

	const isTauri: boolean = "__TAURI__" in window;

	const login = useLoginFromToken();

	const mailClient = useMailClient();

	return async (config) => {
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

			const { version: serverVersion, type: serverVersionType }: Version =
				versionResponseResult.data;

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

		const incomingConfig = config.incoming;
		// Outgoing config is incoming because there is no support for outgoing servers yet.
		const outgoingConfig = config.incoming;

		if (incomingConfig === undefined || outgoingConfig === undefined)
			return createBaseError({
				kind: "ConfigNotComplete",
				message: "Config is missing items"
			});

		const id = createIdentifier(incomingConfig, outgoingConfig);

		login(loginResult.data, {
			id,
			usernames: {
				incoming: findUsernameInLoginOptions(incomingConfig),
				outgoing: findUsernameInLoginOptions(outgoingConfig)
			},
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
		id: string;
		usernames: Record<ServerType, string>;
		redirectToDashboard?: boolean;
		setAsDefault?: boolean;
	}
) => void) => {
	const modifyUser = useModifyUser();
	const [, setCurrentUser] = useCurrentUser();

	const user = useUser();

	const navigate = useNavigate();

	return (token, options) => {
		const id = options?.id ?? user?.id;
		const usernames = options?.usernames ?? user?.usernames;

		if (id === undefined || usernames === undefined) return;

		console.log("Successfully authorized with mail servers");

		modifyUser(id, { token, id, usernames });

		setCurrentUser(id);

		if (options?.redirectToDashboard) navigate(`/dashboard`);
	};
};

export default useLoginFromToken;
