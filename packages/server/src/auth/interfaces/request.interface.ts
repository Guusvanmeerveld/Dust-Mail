import Client from "@utils/interfaces/client.interface";
import { Request as ExpressRequest } from "express";

export type Request = ExpressRequest & {
	user: { client: Client };
};
