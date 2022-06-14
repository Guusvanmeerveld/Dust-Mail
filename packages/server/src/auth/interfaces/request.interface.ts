import { Request as ExpressRequest } from "express";

import Client from "../../utils/imap";

export type Request = ExpressRequest & {
	user: { client: Client };
};
