enum Error {
	Credentials = 1,
	Timeout = 2,
	Network = 3,
	Protocol = 4,
	Misc = 5
}

export interface APIError {
	message: string;
	type: Error;
}

export default Error;
