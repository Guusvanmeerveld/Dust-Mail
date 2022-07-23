import { Request as ExpressRequest } from "express";

import IncomingClient from "@mail/interfaces/client/incoming.interface";
import OutgoingClient from "@mail/interfaces/client/outgoing.interface";

export type Request = ExpressRequest & {
	user: { incomingClient: IncomingClient; outgoingClient: OutgoingClient };
};
