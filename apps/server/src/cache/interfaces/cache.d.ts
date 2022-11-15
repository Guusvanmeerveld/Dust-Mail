export type getter = <T>(path: string[]) => Promise<T | undefined>;
export type setter = <T>(path: string[], value: T) => Promise<void>;
export type initter = () => Promise<void>;

export default interface Cache {
	get: getter;
	set: setter;
}
