export type TokenType = "access" | "refresh";

export type Token = { type: TokenType; body: string; expires: Date };
export type LocalToken = Omit<Token, "type">;
export type LoginResponse = Token[];

export interface PublicTokensResponse {
	google?: string;
}

export interface VersionResponse {
	version: string;
	type: "git" | "stable";
}

export interface BoxResponse {
	name: string;
	id: string;
}

export enum GatewayError {
	Credentials = 1,
	Timeout = 2,
	Network = 3,
	Protocol = 4,
	Misc = 5
}

export type PackageError = Error & { source: string };

export interface ErrorResponse {
	message: string;
	code: GatewayError;
}
