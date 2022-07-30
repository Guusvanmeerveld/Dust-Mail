import IncomingClient from "@mail/interfaces/client/incoming.interface";
import OutgoingClient from "@mail/interfaces/client/outgoing.interface";
import { Request as ExpressRequest } from "express";

export type Request = ExpressRequest & {
	user: { incomingClient: IncomingClient; outgoingClient: OutgoingClient };
};
