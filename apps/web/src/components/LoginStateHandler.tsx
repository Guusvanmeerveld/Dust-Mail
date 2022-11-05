import { FC, memo, useEffect, useMemo } from "react";
import { useQuery } from "react-query";

import { LoginResponse } from "@dust-mail/typings";

import useFetch from "@utils/hooks/useFetch";
import useLogin from "@utils/hooks/useLogin";
import useLogout from "@utils/hooks/useLogout";
import useStore from "@utils/hooks/useStore";
import useUser from "@utils/hooks/useUser";

const UnMemoizedLoginStateHandler: FC = () => {
	const { user } = useUser();

	useEffect(() => console.log("login state"), [user]);

	const setFetching = useStore((state) => state.setFetching);
	const fetching = useStore((state) => state.fetching);

	const fetcher = useFetch();

	const logout = useLogout();
	const login = useLogin();

	const accessTokenExpired = useMemo(
		() =>
			user?.accessToken != undefined &&
			new Date(user?.accessToken.expires).getTime() < Date.now(),
		[fetching, user?.accessToken]
	);

	if (
		accessTokenExpired &&
		user?.refreshToken &&
		new Date(user?.refreshToken?.expires).getTime() < Date.now()
	) {
		logout();
	}

	const {
		data: tokens,
		error: tokensError,
		isFetching: isFetchingTokens
	} = useQuery<LoginResponse | undefined>(
		"refreshTokens",
		() => {
			if (!user?.refreshToken) return undefined;

			return fetcher.refresh(user.refreshToken.body);
		},
		{
			enabled: !!(accessTokenExpired && user?.refreshToken)
		}
	);

	useEffect(() => {
		if (tokensError) setFetching(false);
		else setFetching(isFetchingTokens);
	}, [isFetchingTokens, tokensError]);

	useEffect(() => {
		if (tokens && accessTokenExpired) login(tokens);
	}, [tokens]);

	return <></>;
};

const LoginStateHandler = memo(UnMemoizedLoginStateHandler);

export default LoginStateHandler;
