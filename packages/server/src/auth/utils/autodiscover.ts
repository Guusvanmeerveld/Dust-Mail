import dns from "dns/promises";
import axios from "axios";

export const fetchServerFromEmail = async (
	email: string,
	password: string
): Promise<{ server: string; port: number }> => {
	const server = email.split("@").pop();

	fetchServerWithAutodiscover(server, { username: email, password });

	return { server, port: 993 };
};

const fetchServerWithAutodiscover = async (
	server: string,
	credentials: { username: string; password: string }
): Promise<string | undefined> => {
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

		const data = await axios
			.post(
				`${response.port == 443 ? "https" : "http"}://${
					response.name
				}/Autodiscover/Autodiscover.svc`,
				{},
				{
					auth: credentials,
					headers: { "Content-Type": "text/xml; charset=utf-8" }
				}
			)
			.then(({ data }) => data);

		console.log(data);
	}

	return;
};
