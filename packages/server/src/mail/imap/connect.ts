import Imap from "imap";

const connect = async (_client: Imap): Promise<void> => {
	return new Promise((resolve, reject) => {
		_client.connect();

		_client.on("ready", () => resolve());
		_client.on("error", (error) => reject(error));
	});
};

export default connect;
