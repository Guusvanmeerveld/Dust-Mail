import md5 from "js-md5";

const createGravatarUrl = (email: string): string =>
	`https://www.gravatar.com/avatar/${md5(
		email.trim().toLocaleLowerCase()
	)}?d=404`;

export default createGravatarUrl;
