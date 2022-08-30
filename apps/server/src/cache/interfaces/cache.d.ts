export type getter = <T>(path: string[]) => T;
export type setter = (path: string[], value: string) => void;
export type initter = () => Promise<void>;
export type writer = () => Promise<void>;

export default interface Cache {
	init: initter;
	get: getter;
	set: setter;
	write: writer;
}
