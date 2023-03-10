const parseJsonAsync = async (input: string): Promise<unknown> => {
	return new Promise((resolve, reject) => {
		try {
			resolve(JSON.parse(input));
		} catch (error) {
			reject(error);
		}
	});
};

export default parseJsonAsync;
