import createMd5Hash from "js-md5";

const createAvatarUrl = (email: string): string => {
	const hashed = createMd5Hash(email.trim().toLowerCase());

	const searchParams = new URLSearchParams();

	searchParams.set("s", "64");
	searchParams.set("d", "404");

	return (
		"https://www.gravatar.com/avatar/" + hashed + "?" + searchParams.toString()
	);
};

export default createAvatarUrl;
