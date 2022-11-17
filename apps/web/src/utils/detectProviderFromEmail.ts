import { EmailProvider } from "@dust-mail/typings";

const detectProviderFromEmail = (emailAddress: string): EmailProvider => {
	if (
		emailAddress.endsWith("google.com") ||
		emailAddress.endsWith("gmail.com") ||
		emailAddress.endsWith("googlemail.com")
	)
		return "google";
	else if (
		emailAddress.endsWith("pm.me") ||
		emailAddress.endsWith("protonmail.com")
	)
		return "protonmail";
	else return "none";
};

export default detectProviderFromEmail;
