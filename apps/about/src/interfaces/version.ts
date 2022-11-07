export default interface Version {
	tag: string;
	description: string | null;
	latest: boolean;
	assets: Asset[];
}

export interface Asset {
	url: string;
	name: string;
}
