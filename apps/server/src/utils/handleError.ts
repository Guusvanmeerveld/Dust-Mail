import { UserError, PackageError } from "@dust-mail/typings";

import {
	BadGatewayException,
	GatewayTimeoutException,
	InternalServerErrorException,
	UnauthorizedException
} from "@nestjs/common";

export const parseError = (error: PackageError): UserError => {
	// console.log(error);

	if (error.source == "socket") {
		return UserError.Network;
	}

	if (error.source == "timeout") {
		return UserError.Timeout;
	}

	if (error.source == "authentication") {
		return UserError.Credentials;
	}

	if (error.source == "protocol") {
		return UserError.Protocol;
	}

	return UserError.Misc;
};

const handleError = (error: PackageError) => {
	const errorType = parseError(error);

	const errorMessage = {
		code: errorType,
		message: error.message
	};

	switch (errorType) {
		case UserError.Credentials:
			throw new UnauthorizedException(errorMessage);

		case UserError.Timeout:
			throw new GatewayTimeoutException(errorMessage);

		case UserError.Network || UserError.Protocol:
			throw new BadGatewayException(errorMessage);

		default:
			throw new InternalServerErrorException(errorMessage);
	}
};

export default handleError;
