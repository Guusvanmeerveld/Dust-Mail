import { Result } from "./result";

export default interface OAuth2Client {
	getGrant: (
		providerName: string,
		grantUrl: string,
		tokenUrl: string,
		scopes: string[]
	) => Promise<Result<string>>;
}
