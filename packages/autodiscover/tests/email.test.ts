import { expect, test } from "vitest";

import fetchServerFromEmail from "../src/index";

const invalidEmailErrorMessage = "Email adress is not valid";

test("It will throw an error", async () => {
	await fetchServerFromEmail("test@example").catch((error: Error) =>
		expect(error.message).toBe(invalidEmailErrorMessage)
	);
});

test("It will throw an error", async () => {
	await fetchServerFromEmail(
		"test@guusvanmeerveld.dev/suspicious_url"
	).catch((error: Error) =>
		expect(error.message).toBe(invalidEmailErrorMessage)
	);
});
