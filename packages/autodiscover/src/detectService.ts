import net from "net";

import tls from "tls";

import { IncomingServer, OutgoingServer } from "./interfaces/emailServer";

import ServerConfig from "./interfaces/serverConfig";

/**
 * Will take a config to connect with an email related server and detect what kind of email service is running on that server
 */
export const detectServiceFromConfig = async (
	config: ServerConfig
): Promise<IncomingServer | OutgoingServer> => {
	const responseFromImapCommand: string = await connectToServerAndSendCommand(
		config,
		"abcd CAPABILITY"
	);

	if (responseFromImapCommand) {
		const service = detectServiceFromResponse(responseFromImapCommand);

		if (service) return service;
	}

	throw new Error("Not found");
};

const detectServiceFromResponse = (
	response: string
): IncomingServer | OutgoingServer | void => {
	const split = response.toLowerCase().split(" ");

	const isImap = split.find((string) => string.match(/imap/));

	if (isImap) return "imap";

	const isSmtp = split.find((string) => string.match(/smtp/));

	if (isSmtp) return "smtp";

	const isPop = split.find((string) => string.match(/pop/));

	if (isPop) return "pop3";
};

const connectToServerAndSendCommand = (
	config: ServerConfig,
	command?: string
): Promise<string> =>
	new Promise((resolve, reject) => {
		const connection =
			config.security == "TLS"
				? tls.connect({
						port: config.port,
						host: config.server
				  })
				: net.connect({
						port: config.port,
						host: config.server
				  });

		connection.on("close", reject);

		connection.on("error", reject);

		connection.on("connect", () => {
			if (command)
				connection.write(command, () =>
					setTimeout(() => {
						connection.destroy();
						reject();
					}, 10000)
				);
		});

		connection.on("data", (chunk) => {
			connection.destroy();
			resolve(chunk.toString());
		});
	});
