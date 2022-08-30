import { LoginConfig } from "@interfaces/login";

import {
	BoxResponse,
	LoginResponse,
	VersionResponse,
	PublicTokensResponse,
	IncomingMessage
} from "@dust-mail/typings";

export default interface HttpClient {
	getVersion: () => Promise<VersionResponse>;
	login: (config: LoginConfig) => Promise<LoginResponse>;
	refresh: (refreshToken?: string) => Promise<LoginResponse>;
	getBoxes: (token?: string) => Promise<BoxResponse[]>;
	getPublicOAuthTokens: () => Promise<PublicTokensResponse>;
	getAvatar: (address?: string) => Promise<string>;
	getBox: (boxID: string, pageParam: number) => Promise<IncomingMessage[]>;
	getMessage: (
		messageID?: string,
		boxID?: string
	) => Promise<FullIncomingMessage>;
}
