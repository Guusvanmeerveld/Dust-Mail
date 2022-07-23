import { Injectable } from "@nestjs/common";

import Cache from "../interfaces/cache";

@Injectable()
export default class RedisCache implements Cache {
	get = <T>(key: string) => {
		return {} as T;
	};
}
