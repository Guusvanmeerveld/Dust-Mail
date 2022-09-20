import { BoxResponse } from "@dust-mail/typings";

export default interface Box extends BoxResponse {
	icon?: JSX.Element;
	children?: Box[];
	unifies?: Box[];
	delimiter?: string;
}
