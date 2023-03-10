import z from "zod";

import { Result } from "./result";

import { ApiSettingsModel } from "@models/api/settings";

export default interface ApiClient {
	getChangelog: () => Promise<Result<string>>;
	getSettings: (
		baseUrl?: string
	) => Promise<Result<z.infer<typeof ApiSettingsModel>>>;
	login: (
		baseUrl?: string,
		password?: string,
		username?: string
	) => Promise<Result<void>>;
}
