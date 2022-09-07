import { XMLParser } from "fast-xml-parser";

import { OutgoingServiceType, IncomingServiceType } from "@dust-mail/typings";

import AutoConfigFile, { Server } from "./interfaces/autoConfigFile";
import AutodiscoverResponse, {
	EmailServer,
	Security
} from "./interfaces/emailServer";

import axios from "axios";

const fetchServerWithThunderbird = async (
	server: string,
	email: string
): Promise<AutodiscoverResponse | undefined> => {
	const emailProviderUrl = `http://autoconfig.${server}/mail/config-v1.1.xml?emailaddress=${email}`;

	const emailProviderResponse = await axios
		.get<string>(emailProviderUrl, {
			method: "GET"
		})
		.catch(() => {
			return;
		});

	if (emailProviderResponse && emailProviderResponse.data) {
		const data = parseAutoConfigFile(emailProviderResponse.data);

		if (data) return data;
	}

	const emailProviderBackupUrl = `http://${server}/.well-known/autoconfig/mail/config-v1.1.xml`;

	const emailProviderBackupResponse = await axios
		.get<string>(emailProviderBackupUrl, {
			method: "GET"
		})
		.catch(() => {
			return;
		});

	if (emailProviderBackupResponse && emailProviderBackupResponse.data) {
		const data = parseAutoConfigFile(emailProviderBackupResponse.data);

		if (data) return data;
	}

	const mozillaServerUrl = `https://autoconfig.thunderbird.net/v1.1/${server}`;

	const mozillaServerResponse = await axios
		.get<string>(mozillaServerUrl, {
			method: "GET"
		})
		.catch(() => {
			return;
		});

	if (mozillaServerResponse && mozillaServerResponse.data) {
		const data = parseAutoConfigFile(mozillaServerResponse.data);

		if (data) return data;
	}

	return;
};

const parseAutoConfigFile = (
	autoConfigFile: string
): AutodiscoverResponse | undefined => {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "",
		attributesGroupName: "@"
	});

	const data: AutoConfigFile | undefined = parser.parse(autoConfigFile);

	if (!data?.clientConfig?.emailProvider) return;

	const incomingServers = data.clientConfig.emailProvider.incomingServer;

	let incomingServer: Server | undefined;

	if (Array.isArray(incomingServers)) {
		if (incomingServers.length != 0) incomingServer = incomingServers[0];
	} else incomingServer = incomingServers;

	const incomingServerType = incomingServer?.["@"].type as IncomingServiceType;

	const outgoingServers = data.clientConfig.emailProvider.outgoingServer;

	let outgoingServer: Server | undefined;

	if (Array.isArray(outgoingServers)) {
		if (outgoingServers.length != 0) outgoingServer = outgoingServers[0];
	} else outgoingServer = outgoingServers;

	const outgoingServerType = outgoingServer?.["@"].type as OutgoingServiceType;

	return [
		createEmailServer(incomingServerType, incomingServer),
		createEmailServer(outgoingServerType, outgoingServer)
	];
};

function createEmailServer(
	type: IncomingServiceType,
	server?: Server
): EmailServer<IncomingServiceType>;
function createEmailServer(
	type: OutgoingServiceType,
	server?: Server
): EmailServer<OutgoingServiceType>;
function createEmailServer(
	type: IncomingServiceType | OutgoingServiceType,
	server?: Server
): EmailServer<IncomingServiceType | OutgoingServiceType> | undefined {
	if (!server) return;

	let security: Security;

	switch (server.socketType) {
		case "SSL":
			security = "TLS";
			break;

		case "STARTTLS":
			security = "STARTTLS";
			break;

		case "plain":
			security = "NONE";
			break;
	}

	return {
		port: server.port,
		server: server.hostname,
		security,
		type
	};
}

export default fetchServerWithThunderbird;
