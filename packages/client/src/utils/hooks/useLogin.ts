import useLocalStorageState from "use-local-storage-state";

import { useNavigate } from "react-router-dom";

import Error from "@interfaces/error";
import AdvancedLogin from "@interfaces/login";
import { LocalToken, LoginResponse } from "@interfaces/responses";

import createGravatarUrl from "@utils/createGravatarUrl";
import useFetch from "@utils/hooks/useFetch";
import useStore from "@utils/hooks/useStore";

/**
 * Request the users inboxes and puts them in local storage
 */
const useFetchBoxes = (): ((token: string) => Promise<void>) => {
	const fetcher = useFetch();

	const [, setBoxes] = useLocalStorageState<{ name: string; id: string }>(
		"boxes"
	);

	return async (token): Promise<void> => {
		console.log("Fetching inboxes...");

		const boxes = await fetcher
			.get<string[]>("/mail/boxes", {
				headers: { Authorization: `Bearer ${token}` }
			})
			.then(({ data }) => data);

		setBoxes(boxes);
	};
};

export const useMailLogin = (): ((config: {
	incoming: AdvancedLogin;
	outgoing?: AdvancedLogin;
}) => Promise<void>) => {
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
			.get("/system/version")
			.catch((error) => {
				setFetching(false);

				// Handle axios errors
				if (error.code == "ERR_NETWORK") {
					throw {
						message: `Could not connect to remote ${
							import.meta.env.VITE_APP_NAME
						} server, please check your connectivity`,
						type: Error.Misc
					};
				} else {
					throw {
						message: `An unknown error occured: ${error.message}`,
						type: Error.Misc
					};
				}
			});

		if (!versionResponse) return;

		const {
			version: serverVersion,
			type: serverVersionType
		}: { version: string; type: "git" | "stable" } = versionResponse.data;

		if (
			serverVersion != appVersion.title ||
			serverVersionType != appVersion.type
		) {
			setFetching(false);

			throw {
				message: `Server and client versions did not match, server has version ${serverVersion} (${serverVersionType}) while client has version ${appVersion.title} (${appVersion.type})`,
				type: Error.Misc
			};
		}

		console.log("Sending login request...");

		// Request the JWT token
		const res = await fetcher.post(
			"/auth/login",
			{
				incoming_username: config.incoming.username,
				incoming_password: config.incoming.password,
				incoming_server: config.incoming.server,
				incoming_port: config.incoming.port,
				incoming_security: config.incoming.security,
				outgoing_username:
					config.outgoing?.username ?? config.incoming.username,
				outgoing_password:
					config.outgoing?.password ?? config.incoming.password,
				outgoing_server: config.outgoing?.server ?? config.incoming.server,
				outgoing_port: config.outgoing?.port,
				outgoing_security: config.outgoing?.security
			},
			{ validateStatus: () => true }
		);

		if (!res) return;

		const { status, data } = res;

		// If there was anything wrong with the request, catch it
		if (status == 400) {
			// Hide the fetching animation
			setFetching(false);

			console.log("An error occured when requesting the JWT token");

			// Check the error type
			switch (data.code as Error) {
				case Error.Credentials:
					throw {
						message: `Failed to authorize with server, please check your credentials: ${data.message}`,
						type: Error.Credentials
					};

				case Error.Timeout:
					throw {
						message: "Server connection timed out",
						type: Error.Timeout
					};

				case Error.Network:
					throw {
						message: `Failed to connect to remote imap server, please check your configuration: ${data.message}`,
						type: Error.Network
					};

				default:
					throw {
						message: `Unknown error ocurred: ${data.message}`,
						type: Error.Misc
					};
			}
		}

		// Check if the request was successfull
		if (status == 201) {
			login(data, {
				username: config.incoming.username,
				redirectToDashboard: true
			});
		}

		setFetching(false);

		throw {
			message: `Unknown error with status code ${status} occured`,
			type: Error.Misc
		};
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
