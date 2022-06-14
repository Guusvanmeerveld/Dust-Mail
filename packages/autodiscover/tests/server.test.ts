import fetchServerWithAutodiscover from "../src/autodiscover";

describe("Validate autodiscover checker", () => {
	jest.setTimeout(15000);

	test("It will throw an error", async () => {
		await fetchServerWithAutodiscover("ru.nl", {
			password: "bEb@LFRtquu9k6jdQHQn2$rKpGx@uXXJEnnL2sz!",
			username: "guus.vanmeerveld@ru.nl"
		})
			.catch((error: Error) =>
				expect(error.message).toBe("Email adress is not valid")
			)
			.then((data) => {
				expect(data).toBeUndefined();
			});
	});
});
