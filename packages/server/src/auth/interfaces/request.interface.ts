import { Request as ExpressRequest } from "express";

import IncomingClient from "@utils/interfaces/client/incoming.interface";
import OutgoingClient from "@utils/interfaces/client/outgoing.interface";

export type Request = ExpressRequest & {
	user: { incomingClient: IncomingClient; outgoingClient: OutgoingClient };
};
