import { ErrorResponse, GatewayError, PackageError } from "@dust-mail/typings";

import {
	BadGatewayException,
	GatewayTimeoutException,
	InternalServerErrorException,
	UnauthorizedException
} from "@nestjs/common";

export const parseError = (error: PackageError): GatewayError => {
	// console.log(error);

	if (error?.source) {
		if (error.source == "socket") {
			return GatewayError.Network;
		}

		if (error.source == "timeout") {
			return GatewayError.Timeout;
		}

		if (error.source == "authentication") {
			return GatewayError.Credentials;
		}

		if (error.source == "protocol") {
			return GatewayError.Protocol;
		}
	}

	return GatewayError.Misc;
};

const handleError = (error: PackageError) => {
	const errorType = parseError(error);

	const errorMessage: ErrorResponse = {
		code: errorType,
		message: error?.message ?? "none"
	};

	switch (errorType) {
		case GatewayError.Credentials:
			throw new UnauthorizedException(errorMessage);

		case GatewayError.Timeout:
			throw new GatewayTimeoutException(errorMessage);

		case GatewayError.Network || GatewayError.Protocol:
			throw new BadGatewayException(errorMessage);

		default:
			throw new InternalServerErrorException(errorMessage);
	}
};

export default handleError;
