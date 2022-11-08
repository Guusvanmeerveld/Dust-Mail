import { FC } from "react";

const Header: FC<{ title: string; description: string }> = ({
	title,
	description
}) => {
	return (
		<header>
			<nav>
				<a href="/">Home</a>
				<a href="/download">Download</a>
				<a href={`https://docs.${process.env.NEXT_PUBLIC_DOMAIN}`}>Docs</a>
				<a href={`https://app.${process.env.NEXT_PUBLIC_DOMAIN}`}>Demo</a>
				<a href={`https://github.com/Guusvanmeerveld/Dust-Mail`}>Github</a>
			</nav>
			<h1>Dust-Mail - {title}</h1>
			<p>{description}</p>
		</header>
	);
};

export default Header;
