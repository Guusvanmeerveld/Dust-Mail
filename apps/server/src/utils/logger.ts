import { gray, green, reset, red, yellow, cyan, blue } from "kleur";

import { LoggerService } from "@nestjs/common";

export class AppLogger implements LoggerService {
	private base(
		color: (toColor: string) => string,
		message: any,
		...optionalParams: any[]
	) {
		const params = optionalParams.map((param) => green(`[${param}]`));

		const time = gray(new Date().toLocaleTimeString());

		process.stdout.write(`[${time}] ${params.join(" ")} ${color(message)} \n`);
	}

	/**
	 * Write a 'log' level log.
	 */
	log(message: any, ...optionalParams: any[]) {
		this.base(reset, message, ...optionalParams);
	}

	/**
	 * Write an 'error' level log.
	 */
	error(message: any, ...optionalParams: any[]) {
		this.base(red, message, ...optionalParams);
	}

	/**
	 * Write a 'warn' level log.
	 */
	warn(message: any, ...optionalParams: any[]) {
		this.base(yellow, message, ...optionalParams);
	}

	/**
	 * Write a 'debug' level log.
	 */
	debug?(message: any, ...optionalParams: any[]) {
		this.base(cyan, message, ...optionalParams);
	}

	/**
	 * Write a 'verbose' level log.
	 */
	verbose?(message: any, ...optionalParams: any[]) {
		this.base(blue, message, ...optionalParams);
	}
}
