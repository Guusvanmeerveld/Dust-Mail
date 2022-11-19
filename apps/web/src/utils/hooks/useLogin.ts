import useUser, { useCurrentUser, useModifyUser } from "./useUser";

import { useNavigate } from "react-router-dom";

import { AxiosError } from "axios";

import {
	ErrorResponse,
	LoginResponse,
	VersionResponse,
	GatewayError
} from "@dust-mail/typings";

import Box from "@interfaces/box";
import { LoginConfig } from "@interfaces/login";

import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";
import useFetch from "@utils/hooks/useFetch";
import useStore from "@utils/hooks/useStore";

/**
 * A hook that request the users inboxes and returns them
 */
const useFetchBoxes = (): ((token: string) => Promise<Box[]>) => {
	const fetcher = useFetch();

	return async (token) => {
		console.log("Fetching inboxes...");

		const boxes = await fetcher.getBoxes(token);

		const boxIDs = boxes.map((box) => box.id);

		const unreadCount = await fetcher.getMessageCount(boxIDs, "unread", token);

		return boxes.map((box) => {
			const foundBox = findBoxInPrimaryBoxesList(box.id);

			const split = box.id.split(box.delimiter);

			return {
				...box,
				unreadCount: unreadCount[box.id],
				name: foundBox?.name ?? split.pop() ?? box.name
			};
		});
	};
};

export const useMailLogin = (): ((config: LoginConfig) => Promise<void>) => {
	const appVersion = useStore((state) => state.appVersion);
	const setFetching = useStore((state) => state.setFetching);

	const login = useLogin();

	const fetcher = useFetch();

	return async (config) => {
		if (!config.incoming.username || !config.incoming.password) return;

		// Show the fetching animation
		setFetching(true);

		console.log("Checking if server version matches with client version...");

		const versionResponse = await fetcher
			.getVersion()
			.catch((e: ErrorResponse) => {
				setFetching(false);

				throw e;
			});

		if (!versionResponse) return;

		const { version: serverVersion, type: serverVersionType }: VersionResponse =
			versionResponse;

		if (serverVersion != appVersion.title) {
			setFetching(false);

			throw {
				message: `Server and client versions did not match, server has version ${serverVersion} (${serverVersionType}) while client has version ${appVersion.title} (${appVersion.type})`,
				type: GatewayError.Misc
			};
		}

		console.log("Sending login request...");

		// Request the JWT token
		const data = await fetcher
			.login(config)
			// If there was anything wrong with the request, catch it
			.catch((error: AxiosError<ErrorResponse>) => {
				// Hide the fetching animation
				setFetching(false);

				console.log("An error occured when requesting the JWT token");

				// Check the error type
				switch (error.response?.data.code) {
					case GatewayError.Credentials:
						throw {
							message: `Failed to authorize with mail server, please check your credentials: ${error.response?.data.message}`,
							code: GatewayError.Credentials
						};

					case GatewayError.Timeout:
						throw {
							message: "Connection with mail server timed out",
							code: GatewayError.Timeout
						};

					case GatewayError.Network:
						throw {
							message: `Failed to connect to remote mail server, please check your configuration: ${error.response?.data.message}`,
							code: GatewayError.Network
						};

					default:
						throw {
							message: `Unknown error ocurred: ${error.response?.data.message}`,
							code: GatewayError.Misc
						};
				}
			});

		login(data, {
			username: config.incoming.username,
			redirectToDashboard: true,
			setAsDefault: true
		}).catch((e: AxiosError<ErrorResponse>) => {
			throw e.response?.data;
		});

		setFetching(false);
	};
};

const useLogin = (): ((
	tokens: LoginResponse,
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

	const fetchBoxes = useFetchBoxes();

	return async (tokens, options) => {
		const accessToken = tokens.find(({ type }) => type == "access");

		if (!accessToken) return;

		const refreshToken = tokens.find(({ type }) => type == "refresh");

		if (!refreshToken) return;

		const username = options?.username ?? user?.username;

		if (!username) return;

		console.log("Successfully authorized with backend server");

		const boxes = await fetchBoxes(accessToken.body);

		modifyUser(username, { accessToken, refreshToken, boxes, username });

		setCurrentUser(username);

		if (options?.redirectToDashboard) navigate(`/dashboard`);
	};
};

export default useLogin;
