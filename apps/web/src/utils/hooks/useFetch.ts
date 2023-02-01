import useLocalStorageState from "use-local-storage-state";

import { version } from "../../../package.json";
import useUser from "./useUser";

import axios, { AxiosError } from "axios";

import {
	VersionResponse,
	GatewayError,
	PackageError
} from "@dust-mail/typings";

import { messageCountForPage } from "@src/constants";

import HttpClient from "@interfaces/http";

const UNIX_PREFIX = "unix://";

const useHttpClient = (token?: string): HttpClient => {
	let [backendServer] = useLocalStorageState<string>("customServerUrl", {
		defaultValue: import.meta.env.VITE_DEFAULT_SERVER
	});

	const user = useUser();

	const isUnixSocket = backendServer.startsWith(UNIX_PREFIX);

	if (isUnixSocket) {
		backendServer = backendServer.replace(UNIX_PREFIX, "");
	}

	const instance = axios.create({
		baseURL: backendServer,
		headers: {
			Authorization: `Bearer ${token ?? user?.token}`
		}
	});

	return {
		async getChangelog() {
			const { data } = await axios.get(
				`https://raw.githubusercontent.com/${
					import.meta.env.VITE_REPO
				}/${version}/CHANGELOG.md`
			);

			return data;
		},
		async getVersion() {
			const { data } = await axios
				.get<VersionResponse>("/system/version", { baseURL: backendServer })
				.catch((error: AxiosError<PackageError>) => {
					// Handle axios errors
					if (error.code == "ERR_NETWORK") {
						throw {
							message: `Could not connect to remote ${
								import.meta.env.VITE_APP_NAME
							} server, please check your connectivity`,
							code: GatewayError.Misc
						};
					} else {
						throw {
							message: `An unknown error occured: ${error.message}`,
							code: GatewayError.Misc
						};
					}
				});

			return data;
		},
		async login(config) {
			const { data } = await axios.post(
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
					outgoing_server: config.outgoing?.server,
					outgoing_port: config.outgoing?.port,
					outgoing_security: config.outgoing?.security
				},
				{ baseURL: backendServer }
			);

			return data;
		},
		async refresh(refreshToken) {
			const { data } = await instance.get("/auth/refresh", {
				headers: { Authorization: `Bearer ${refreshToken}` }
			});

			return data;
		},
		async getBoxes(token?: string) {
			const { data } = await instance.get("/mail/folders", {
				headers: {
					Authorization: `Bearer ${token ?? user?.token}`
				}
			});

			return data;
		},
		async getPublicOAuthTokens() {
			const { data } = await instance.get("/auth/oauth/tokens");

			return data;
		},
		async getBox(boxID, pageParam, filter) {
			// The amount of messages to load per request
			const { data } = await instance.get("/mail/folder", {
				params: {
					cursor: pageParam,
					limit: messageCountForPage,
					folder: boxID,
					filter
				}
			});

			return data;
		},
		async createBox(id: string) {
			await instance.put("/mail/folder/create", { id });
		},
		async deleteBox(ids: string[]) {
			await instance.delete("/mail/folder/delete", {
				params: { id: ids.join(",") }
			});
		},
		async renameBox(oldBoxID: string, newBoxID: string) {
			await instance.put("/mail/folder/rename", {
				oldID: oldBoxID,
				newID: newBoxID
			});
		},
		async getMessageCount(boxes, flag, token?: string) {
			const { data } = await instance.get("/mail/message/count", {
				params: {
					boxes: boxes.join(","),
					flag
				},
				headers: {
					Authorization: `Bearer ${token ?? user?.token}`
				}
			});

			return data;
		},
		async getMessage(noImages, darkMode, messageID, boxID) {
			const { data } = await instance.get("/mail/message", {
				params: {
					id: messageID,
					box: boxID,
					darkMode,
					noImages,
					markRead: true
				}
			});

			return data;
		},
		async getAvatar(address) {
			const res = await instance.get("/avatar", {
				params: { address }
				// validateStatus: (status) =>
				// 	(status >= 200 && status < 300)
			});

			return res?.data;
		}
	};
};

export default useHttpClient;
