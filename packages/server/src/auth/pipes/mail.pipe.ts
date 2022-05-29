import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { emailRegex } from "../constants";

@Injectable()
export class MailValidationPipe implements PipeTransform {
	transform(value: any) {
		if (typeof value != "string") {
			throw new BadRequestException("Email must be a string");
		}

		if (!value.match(emailRegex)) {
			throw new BadRequestException("Invalid email address");
		}

		return value;
	}
}
