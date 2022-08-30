import Imap from "imap";

const connect = async (_client: Imap): Promise<Imap> => {
	return new Promise((resolve, reject) => {
		_client.connect();

		_client.on("ready", () => resolve(_client));
		_client.on("error", (error) => reject(error));
	});
};

export default connect;
