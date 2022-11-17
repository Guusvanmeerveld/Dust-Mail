type GetTokenCallback = (
	error?: string,
	token?: string,
	accessToken?: string
) => void;

interface XOAuth2Gen {
	getToken: (cb: GetTokenCallback) => void;
}

interface CreateXOAuth2GeneratorOptions {
	user: string;
	clientId: string;
	clientSecret: string;
	refreshToken: string;
	accessToken?: string;
	timeout?: number;
	customHeaders?: Record<string, string>;
	customParams?: Record<string, string>;
}

declare module "xoauth2" {
	export function createXOAuth2Generator(
		options: CreateXOAuth2GeneratorOptions
	): XOAuth2Gen;
}
