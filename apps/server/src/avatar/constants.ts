export const avatars: { address: RegExp; avatar: string }[] = [
	{
		address: /@(\w+\.)?instagram\.com/g,
		avatar: "instagram"
	},
	{
		address: /@(\w+\.)?google\.com/g,
		avatar: "google"
	},
	{
		address: /@(\w+\.)?microsoft\.com/g,
		avatar: "microsoft"
	},
	{
		address: /@github\.com/g,
		avatar: "github"
	},
	{
		address: /@snapchat\.com/g,
		avatar: "snapchat"
	},
	{
		address: /@cloudflare\.com/g,
		avatar: "cloudflare"
	},
	{
		address: /@discord\.com/g,
		avatar: "discord"
	}
];
