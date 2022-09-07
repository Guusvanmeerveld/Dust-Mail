import { expect, test } from "vitest";

import { detectServiceFromConfig } from "../src/detectService";
import fetchServerWithThunderbird from "../src/thunderbird";

// import fetchServerWithAutodiscover from "../autodiscover";

const username = "mail@guusvanmeerveld.dev";
const server = username.split("@").pop() as string;

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

test("Detect imap service from config", async () => {
	await detectServiceFromConfig({
		port: 993,
		server: "outlook.office365.com",
		security: "TLS"
	}).then((data) => expect(data).toBe("imap"));
});

test("Detect smtp service from config", async () => {
	await detectServiceFromConfig({
		port: 587,
		server: "smtp-mail.outlook.com",
		security: "STARTTLS"
	}).then((data) => expect(data).toBe("smtp"));
});

test("Detect pop3 service from config", async () => {
	await detectServiceFromConfig({
		port: 995,
		server: "pop3.live.com",
		security: "TLS"
	}).then((data) => expect(data).toBe("pop3"));
});
