import fetchServerFromEmail from "..";

const invalidEmailErrorMessage = "Email adress is not valid";

describe("Validate email tester", () => {
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
});
