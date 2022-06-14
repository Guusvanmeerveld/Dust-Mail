import { isBehindProxy } from "./constants";
import { Request } from "express";

export const parseIpAdressFromRequest = (req: Request): string => {
	let ip: string;

	ip = req.socket.remoteAddress ?? req.ips[0] ?? req.ip;

	const forwardedFor = Array.isArray(req.headers["x-forwarded-for"])
		? req.headers["x-forwarded-for"][0]
		: req.headers["x-forwarded-for"];

	if (isBehindProxy && forwardedFor) ip = forwardedFor;

	return ip;
};
