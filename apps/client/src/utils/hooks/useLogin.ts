import useLocalStorageState from "use-local-storage-state";

import { useNavigate } from "react-router-dom";

import Error from "@interfaces/error";
import { LoginConfig } from "@interfaces/login";
import {
	ErrorResponse,
	LocalToken,
	LoginResponse,
	VersionResponse
} from "@interfaces/responses";

import createGravatarUrl from "@utils/createGravatarUrl";
import useFetch from "@utils/hooks/useFetch";
import useStore from "@utils/hooks/useStore";
import Box from "@interfaces/box";
import { AxiosError } from "axios";

/**
 * Request the users inboxes and puts them in local storage
 */
const useFetchBoxes = (): ((token: string) => Promise<void>) => {
	const fetcher = useFetch();

	const [, setBoxes] = useLocalStorageState<Box[]>("boxes");

	return async (token): Promise<void> => {
		console.log("Fetching inboxes...");

		const boxes = await fetcher.getBoxes(token);

		setBoxes(boxes);
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

		const versionResponse = await fetcher.getVersion().catch((e) => {
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
				type: Error.Misc
			};
		}

		console.log("Sending login request...");

		// Request the JWT token
		const data = await fetcher
			.login(config)
			.catch((error: AxiosError<ErrorResponse>) => {
				// If there was anything wrong with the request, catch it

				// Check if the request was successfull
				if (error.response?.status == 400) {
					// Hide the fetching animation
					setFetching(false);

					console.log("An error occured when requesting the JWT token");

					// Check the error type
					switch (error.response?.data.type) {
						case Error.Credentials:
							throw {
								message: `Failed to authorize with server, please check your credentials: ${error.response?.data.message}`,
								type: Error.Credentials
							};

						case Error.Timeout:
							throw {
								message: "Server connection timed out",
								type: Error.Timeout
							};

						case Error.Network:
							throw {
								message: `Failed to connect to remote imap server, please check your configuration: ${error.response?.data.message}`,
								type: Error.Network
							};

						default:
							throw {
								message: `Unknown error ocurred: ${error.response?.data.message}`,
								type: Error.Misc
							};
					}
				} else {
					throw {
						message: `Unknown error with status code ${status} occured`,
						type: Error.Misc
					};
				}
			});

		login(data, {
			username: config.incoming.username,
			redirectToDashboard: true
		});

		setFetching(false);
	};
};

const useLogin = (): ((
	tokens: LoginResponse,
	options?: {
		username?: string;
		redirectToDashboard?: boolean;
	}
) => Promise<void>) => {
	const [, setAccessToken] = useLocalStorageState<LocalToken>("accessToken");
	const [, setRefreshToken] = useLocalStorageState<LocalToken>("refreshToken");

	const [, setUsername] = useLocalStorageState<string>("username");
	const [, setAvatar] = useLocalStorageState<string>("avatar");

	const [defaultBox] = useLocalStorageState("defaultBox", {
		defaultValue: { id: "INBOX", name: "Inbox" }
	});

	const navigate = useNavigate();

	const fetchBoxes = useFetchBoxes();

	return async (tokens, options) => {
		const accessToken = tokens.find(({ type }) => type == "access_token");

		if (!accessToken) return;

		const refreshToken = tokens.find(({ type }) => type == "refresh_token");

		if (!refreshToken) return;

		console.log("Successfully authorized with backend server");

		await fetchBoxes(accessToken.body);

		if (options?.username) {
			setUsername(options.username);

			console.log("Creating avatar...");

			setAvatar(createGravatarUrl(options.username));
		}

		setAccessToken(accessToken);
		setRefreshToken(refreshToken);

		if (options?.redirectToDashboard) navigate(`/dashboard/${defaultBox.id}`);
	};
};

export default useLogin;
