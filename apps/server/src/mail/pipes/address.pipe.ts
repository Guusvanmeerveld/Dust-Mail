import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class AddressValidationPipe implements PipeTransform {
	public transform(value: any) {
		if (typeof value != "object" && !Array.isArray(value)) {
			throw new BadRequestException("Address must be an object or array");
		}

		if (Array.isArray(value)) {
			value.map(this.validateAddress);
		} else {
			this.validateAddress(value);
		}

		return value;
	}

	private validateAddress(value: any) {
		if (!value.email) {
			throw new BadRequestException("Address must have `email` property");
		}

		if (typeof value.email != "string") {
			throw new BadRequestException("`email` property must be a string");
		}

		if (!value.displayName) {
			throw new BadRequestException("Address must have `displayName` property");
		}

		if (typeof value.displayName != "string") {
			throw new BadRequestException("`displayName` property must be a string");
		}
	}
}
