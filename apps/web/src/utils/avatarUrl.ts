import createMd5Hash from "js-md5";

const createAvatarUrl = (email: string): string => {
	const hashed = createMd5Hash(email.trim().toLowerCase());

	const url = new URL("https://www.gravatar.com/avatar/" + hashed);

	url.searchParams.set("s", "64");
	url.searchParams.set("d", "404");

	return url.toString();
};

export default createAvatarUrl;
