import { Request as ExpressRequest } from "express";

import Client from "@utils/interfaces/client.interface";

export type Request = ExpressRequest & {
	user: { client: Client };
};
