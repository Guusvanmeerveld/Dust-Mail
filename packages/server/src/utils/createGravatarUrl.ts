import { createHash } from "./createHash";

const createGravatarUrl = (email: string) =>
	`https://www.gravatar.com/avatar/${createHash(
		email.trim().toLocaleLowerCase()
	)}?d=404`;

export default createGravatarUrl;
