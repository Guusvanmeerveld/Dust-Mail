import {
	BoxResponse,
	LoginResponse,
	VersionResponse,
	PublicTokensResponse,
	IncomingMessage,
	FullIncomingMessage,
	MessageCountResponse
} from "@dust-mail/typings";

import { LoginConfig } from "@interfaces/login";

export default interface HttpClient {
	getVersion: () => Promise<VersionResponse>;
	login: (config: LoginConfig) => Promise<LoginResponse>;
	refresh: (refreshToken: string) => Promise<LoginResponse>;
	getBoxes: (token?: string) => Promise<BoxResponse[]>;
	getPublicOAuthTokens: () => Promise<PublicTokensResponse>;
	getAvatar: (address?: string) => Promise<string | undefined>;
	getBox: (
		boxID: string,
		pageParam: number,
		filter: string
	) => Promise<IncomingMessage[]>;
	createBox: (id: string) => Promise<void>;
	deleteBox: (ids: string[]) => Promise<void>;
	renameBox: (oldBoxID: string, newBoxID: string) => Promise<void>;
	getMessageCount: (
		boxes: string[],
		flag: string,
		token?: string
	) => Promise<MessageCountResponse>;
	getMessage: (
		noImages: boolean,
		darkMode: boolean,
		messageID?: string,
		boxID?: string
	) => Promise<FullIncomingMessage>;
}
