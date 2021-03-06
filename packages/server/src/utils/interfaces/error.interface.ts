enum UserError {
	Credentials = 1,
	Timeout = 2,
	Network = 3,
	Protocol = 4,
	Misc = 5
}

export type PackageError = Error & { source: string };

export default UserError;
