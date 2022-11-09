export type getter = <T>(path: string[]) => T | undefined;
export type setter = <T>(path: string[], value: T) => Promise<void>;
export type initter = () => Promise<void>;

export default interface Cache {
	init: initter;
	get: getter;
	set: setter;
}
