import { FC } from "react";

const Header: FC = () => {
	return (
		<header>
			<nav>
				<a href="/">Home</a>
				<a href="/download">Download</a>
				<a href={`https://docs.${process.env.NEXT_PUBLIC_DOMAIN}`}>Docs</a>
				<a href={`https://app.${process.env.NEXT_PUBLIC_DOMAIN}`}>Demo</a>
				<a href={`https://github.com/Guusvanmeerveld/Dust-Mail`}>Github</a>
			</nav>
			<h1>Dust-Mail - A simple and fast email client</h1>
			<p>
				A simple and fast email client for the web and desktop, built using
				React, Tauri and Nestjs.
			</p>
		</header>
	);
};

export default Header;
