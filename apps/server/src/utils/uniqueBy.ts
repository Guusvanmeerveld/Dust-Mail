const uniqueBy = <T>(a: T[], key: (item: T) => string) => {
	const seen = {};

	return a.filter((item) => {
		const k = key(item);
		return seen.hasOwnProperty(k) ? false : (seen[k] = true);
	});
};

export default uniqueBy;
