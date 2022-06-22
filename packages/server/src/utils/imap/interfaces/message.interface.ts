import { ParsedMail } from "mailparser";

export default interface Message {
	flags: string[];
	date: Date;
	bodies: {
		which: string;
		body: ParsedMail;
	}[];
}
