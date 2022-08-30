import { BadRequestException } from "@nestjs/common";

import { UserError, PackageError } from "@dust-mail/typings";

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
	throw new BadRequestException({
		code: parseError(error),
		message: error.message
	});
};

export default handleError;
