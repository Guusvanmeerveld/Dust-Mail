import useLocalStorageState from "use-local-storage-state";

import axios from "axios";
import HttpClient from "@interfaces/http";

import { LocalToken, VersionResponse } from "@interfaces/responses";
import Error from "@interfaces/error";
import { messageCountForPage } from "@src/constants";

const useHttpClient = (): HttpClient => {
	const [backendServer] = useLocalStorageState<string>("customServerUrl", {
		defaultValue: import.meta.env.VITE_DEFAULT_SERVER
	});

	const [token] = useLocalStorageState<LocalToken>("accessToken");

	const instance = axios.create({
		baseURL: backendServer,
		headers: {
			Authorization: `Bearer ${token?.body}`
		}
	});

	return {
		async getVersion() {
			const { data } = await instance
				.get<VersionResponse>("/system/version")
				.catch((error) => {
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

			return data;
		},
		async login(config) {
			const { data } = await instance.post("/auth/login", {
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
			});

			return data;
		},
		async refresh(refreshToken) {
			const { data } = await instance.get("/auth/refresh", {
				headers: { Authorization: `Bearer ${refreshToken}` }
			});

			return data;
		},
		async getBoxes(token) {
			const { data } = await instance.get(
				"/mail/boxes",
				token
					? {
							headers: { Authorization: `Bearer ${token}` }
					  }
					: undefined
			);

			return data;
		},
		async getPublicOAuthTokens() {
			const { data } = await instance.get("/auth/oauth/tokens");

			return data;
		},
		async getBox(boxID, pageParam) {
			// The amount of messages to load per request

			const { data } = await instance.get("/mail/box", {
				params: {
					cursor: pageParam,
					limit: messageCountForPage,
					box: boxID
				}
			});

			return data;
		},
		async getMessage(messageID, boxID) {
			const { data } = await instance.get("/mail/message", {
				params: {
					id: messageID,
					box: boxID,
					markRead: true
				}
			});
			return data;
		},
		async getAvatar(address) {
			const { data } = await instance.get("/avatar", {
				params: { address }
			});

			return data;
		}
	};
};

export default useHttpClient;
