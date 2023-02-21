import z from "zod";

import { ServerType } from "@models/login";

export default interface User {
	id: string;
	usernames: Record<z.infer<typeof ServerType>, string>;
	token: string;
}
