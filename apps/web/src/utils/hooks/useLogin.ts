import useLocalStorageState from "use-local-storage-state";

import { useNavigate } from "react-router-dom";

import { AxiosError } from "axios";

import {
	ErrorResponse,
	LocalToken,
	LoginResponse,
	VersionResponse,
	GatewayError
} from "@dust-mail/typings";

import Box from "@interfaces/box";
import { LoginConfig } from "@interfaces/login";

import createGravatarUrl from "@utils/createGravatarUrl";
import findBoxInPrimaryBoxesList from "@utils/findBoxInPrimaryBoxesList";
import useFetch from "@utils/hooks/useFetch";
import useStore from "@utils/hooks/useStore";
import nestBoxes from "@utils/nestBoxes";

/**
 * A hook that request the users inboxes and puts them in local storage
 */
const useFetchBoxes = (): ((token: string) => Promise<void>) => {
	const fetcher = useFetch();

	const [, setBoxes] = useLocalStorageState<Box[]>("boxes");

	return async (token): Promise<void> => {
		console.log("Fetching inboxes...");

		const boxes = await fetcher.getBoxes(token);

		setBoxes(
			nestBoxes(
				boxes.map((box) => {
					const foundBox = findBoxInPrimaryBoxesList(box.id);

					if (!foundBox) return box;

					return {
						...box,
						name: foundBox?.name ?? box.name
					};
				})
			)
		);
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
				type: GatewayError.Misc
			};
		}

		console.log("Sending login request...");

		// Request the JWT token
		const data = await fetcher
			.login(config)
			.catch((error: AxiosError<ErrorResponse>) => {
				// If there was anything wrong with the request, catch it

				setFetching(false);

				// Check if the request was successfull

				// Hide the fetching animation

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
		const accessToken = tokens.find(({ type }) => type == "access");

		if (!accessToken) return;

		const refreshToken = tokens.find(({ type }) => type == "refresh");

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
