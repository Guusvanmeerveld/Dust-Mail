import { Security } from "./emailServer";

export default interface ServerConfig {
	security: Security;
	port: number;
	server: string;
}
