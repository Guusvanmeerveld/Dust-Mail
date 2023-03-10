import { AuthType, ConnectionSecurity } from "@dust-mail/structures";

export default interface MultiServerLoginOptions {
	username: string;
	password: string;
	domain: string;
	port: number;
	security: ConnectionSecurity;
	loginType: AuthType[];
}
