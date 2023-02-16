import {
	LoginResponse,
	PublicTokensResponse,
	MessageCountResponse
} from "@dust-mail/typings";

export default interface HttpClient {
	refresh: (refreshToken: string) => Promise<LoginResponse>;
	getPublicOAuthTokens: () => Promise<PublicTokensResponse>;
	getChangelog: () => Promise<string>;
	getAvatar: (address: string | null) => Promise<string | undefined>;
	createBox: (id: string) => Promise<void>;
	deleteBox: (ids: string[]) => Promise<void>;
	renameBox: (oldBoxID: string, newBoxID: string) => Promise<void>;
	getMessageCount: (
		boxes: string[],
		flag: string,
		token?: string
	) => Promise<MessageCountResponse>;
}
