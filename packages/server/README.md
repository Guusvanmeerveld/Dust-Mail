# Mail-Server

ENV's:

- MAIL_FETCH_LIMIT: Max amount of emails the client is able to fetch at once. Default: 25
- JWT_SECRET: The JSON webtoken secret
- JWT_EXPIRES: The expiry time in seconds for the JSON webtoken. Default: 600
- ALLOWED_DOMAINS: The domains for the imap servers that the server can fetch, seperated by comma's.
- PROXY: A boolean value to signify if the server is behind a proxy. Default: false
