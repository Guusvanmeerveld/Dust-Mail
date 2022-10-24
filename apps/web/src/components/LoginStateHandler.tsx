import useLocalStorageState from "use-local-storage-state";

import { FC, memo, useEffect, useMemo } from "react";
import { useQuery } from "react-query";

import { LocalToken, LoginResponse } from "@dust-mail/typings";

import useFetch from "@utils/hooks/useFetch";
import useLogin from "@utils/hooks/useLogin";
import useLogout from "@utils/hooks/useLogout";
import useStore from "@utils/hooks/useStore";

const UnMemoizedLoginStateHandler: FC = () => {
	const [accessToken] = useLocalStorageState<LocalToken>("accessToken");
	const [refreshToken] = useLocalStorageState<LocalToken>("refreshToken");

	const setFetching = useStore((state) => state.setFetching);
	const fetching = useStore((state) => state.fetching);

	const fetcher = useFetch();

	const logout = useLogout();
	const login = useLogin();

	const accessTokenExpired = useMemo(
		() =>
			accessToken != undefined &&
			new Date(accessToken.expires).getTime() < Date.now(),
		[fetching, accessToken]
	);

	if (
		accessTokenExpired &&
		refreshToken &&
		new Date(refreshToken?.expires).getTime() < Date.now()
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
			if (!refreshToken) return undefined;

			return fetcher.refresh(refreshToken.body);
		},
		{
			enabled: !!(accessTokenExpired && refreshToken)
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
