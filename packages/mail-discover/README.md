# Mail-Discover

This is a simple NPM package to identify and lookup any imap, pop3, smtp or any other mail related servers related to an email address

Example:

```js
import mailDiscover from "mail-discover";

const fetch = async () => {
	const servers = await mailDiscover("guusvanmeerveld@gmail.com");

	console.log(servers);
};

fetch();
```

Output:

```json
[
	{
		"port": 993,
		"security": "TLS",
		"server": "imap.gmail.com",
		"type": "imap"
	},
	{
		"port": 465,
		"security": "TLS",
		"server": "smtp.gmail.com",
		"type": "smtp"
	}
]
```
