import fetchServerFromEmail from "../src";

describe("Validate email tester", () => {
	test("It will throw an error", async () => {
		await fetchServerFromEmail("test@example").catch((error: Error) =>
			expect(error.message).toBe("Email adress is not valid")
		);
	});
});
