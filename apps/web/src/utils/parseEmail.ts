import z from "zod";

import parseZodOutput from "./parseZodOutput";

import { Result } from "@interfaces/result";

const parseEmail = (
	emailAddressToCheck: unknown
): Result<{ full: string; identifier: string; domain: string }> => {
	const emailAddressParsed = z.string().email().safeParse(emailAddressToCheck);

	const emailAddressResult = parseZodOutput(emailAddressParsed);

	if (emailAddressResult.ok) {
		const emailAdressSplit = emailAddressResult.data.split("@");

		const identifier = emailAdressSplit[0];

		const domain = emailAdressSplit[1];

		return {
			ok: true,
			data: { full: emailAddressResult.data, domain, identifier }
		};
	} else {
		return emailAddressResult;
	}
};

export default parseEmail;
