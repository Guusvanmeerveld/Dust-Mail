import axios from "axios";

import dns from "dns/promises";

import AutodiscoverResponse from "./interfaces/emailServer";

interface Credentials {
	username: string;
	password: string;
}

const fetchServerWithAutodiscover = async (
	server: string,
	credentials?: Credentials
): Promise<AutodiscoverResponse | undefined> => {
	const srv: {
		name: string;
		port: number;
		priority: number;
		weight: number;
	}[] = await dns.resolveSrv(`_autodiscover._tcp.${server}`).catch(() => []);

	let autoDiscoverDomain: string;

	if (srv.length != 0) {
		const response = srv.reduce((max, item) =>
			item.priority > max.priority ? item : max
		);

		await fetchDataFromAutodiscoverURL(
			response.name,
			response.port,
			credentials
		);

		return;
	} else {
		await fetchDataFromAutodiscoverURL(server, 443, credentials);
		return;
	}
};

const fetchDataFromAutodiscoverURL = async (
	server: string,
	port: number,
	credentials?: Credentials
) => {
	const data = await axios(
		`${
			port == 443 ? "https" : "http"
		}://${server}/Autodiscover/Autodiscover.svc`,
		{
			method: "POST",
			headers: { "Content-Type": "text/xml; charset=utf-8" }
		}
	).catch((error) => {
		// console.log(error);
	});

	// console.log(data);
};

export default fetchServerWithAutodiscover;
