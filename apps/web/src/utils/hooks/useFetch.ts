import useLocalStorageState from "use-local-storage-state";

import { version } from "../../../package.json";
import useUser from "./useUser";

import axios from "axios";

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

		async refresh(refreshToken) {
			const { data } = await instance.get("/auth/refresh", {
				headers: { Authorization: `Bearer ${refreshToken}` }
			});

			return data;
		},
		async getPublicOAuthTokens() {
			const { data } = await instance.get("/auth/oauth/tokens");

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
