import fetchServerWithThunderbird from "../thunderbird";
// import fetchServerWithAutodiscover from "../autodiscover";

const username = "mail@guusvanmeerveld.dev";
const server = username.split("@").pop() as string;

describe("Validate autodiscover checker", () => {
	// test("Test autodiscover functionality", async () => {
	// 	await fetchServerWithAutodiscover(server)
	// 		.catch((error: Error) =>
	// 			expect(error.message).toBe("Email adress is not valid")
	// 		)
	// 		.then((data) => expect(data).toBeUndefined());
	// });

	test("Test Thunderbird autoconfig discovery functionality", async () => {
		await fetchServerWithThunderbird(server, username).then((data) => {
			expect(data).toMatchSnapshot();
		});
	});
});
