import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

import isEmail from "validator/lib/isEmail";

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
