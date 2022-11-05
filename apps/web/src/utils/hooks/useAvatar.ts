import { useMemo } from "react";
import { useQuery } from "react-query";

import { AxiosError } from "axios";

import { ErrorResponse } from "@dust-mail/typings";

// import { AxiosError } from "axios";
import useFetch from "@utils/hooks/useFetch";

/**
 * Time to refresh avatars in inbox in seconds
 */
const REFRESH_INBOX_AVATARS = 60 * 60;

export default function useAvatar(
	email?: string | undefined
): { data?: string; isLoading: boolean } | void {
	const fetcher = useFetch();

	const id = ["noAvatar", email].join("-");

	let noAvatar: number | undefined;
	let setNoAvatar: ((date: number) => void) | undefined;

	if (
		"sessionStorage" in window &&
		"getItem" in sessionStorage &&
		"setItem" in sessionStorage
	) {
		noAvatar = parseInt(sessionStorage.getItem(id) ?? "");
		setNoAvatar = (date) => sessionStorage.setItem(id, date.toString());
	}

	const blacklisted = !!noAvatar;

	const { data, isLoading, error } = useQuery<
		string,
		AxiosError<ErrorResponse>
	>(
		["avatar", email],
		() => fetcher.getAvatar(email),
		// .catch((error: AxiosError) => {
		// 	if (error.response?.status == 404) {
		// 	}
		// }),
		{
			retry: false,
			enabled:
				(email != undefined && !blacklisted) ||
				!!(noAvatar && noAvatar < Date.now())
		}
	);

	if (
		error &&
		!data &&
		!isLoading &&
		(!noAvatar || noAvatar < Date.now()) &&
		setNoAvatar
	) {
		setNoAvatar(Date.now() + REFRESH_INBOX_AVATARS * 1000);
	}

	return useMemo(() => ({ data, isLoading }), [data, isLoading]);
}
