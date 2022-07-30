import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class StringValidationPipe implements PipeTransform {
	transform(value: any) {
		if (value == undefined) return value;

		if (typeof value != "string") {
			throw new BadRequestException("Value must be a string");
		}

		return value;
	}
}
