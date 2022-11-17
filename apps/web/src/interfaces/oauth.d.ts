import { LoginResponse } from "@dust-mail/typings";

export interface OAuthLoginResponse {
	tokens: LoginResponse;
	username: string;
}
