import isEmail from "validator/lib/isEmail";

import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class MailValidationPipe implements PipeTransform {
	transform(value: any) {
		if (typeof value != "string") {
			throw new BadRequestException("Email must be a string");
		}

		if (!isEmail(value)) {
			throw new BadRequestException("Invalid email address");
		}

		return value;
	}
}
