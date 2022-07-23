type getter = <T>(key: string) => T;

export default interface Cache {
	get: getter;
}
