import Link from "next/link";

import { FC } from "react";

const Header: FC<{ title: string; description: string }> = ({
	title,
	description
}) => {
	return (
		<header>
			<nav>
				<Link href="/">Home</Link>
				<Link href="/download">Download</Link>
				<Link href={`https://docs.${process.env.NEXT_PUBLIC_DOMAIN}`}>
					Docs
				</Link>
				<Link href={`https://app.${process.env.NEXT_PUBLIC_DOMAIN}`}>Demo</Link>
				<Link href={`https://github.com/Guusvanmeerveld/Dust-Mail`}>
					Github
				</Link>
			</nav>
			<h1>Dust-Mail - {title}</h1>
			<p>{description}</p>
		</header>
	);
};

export default Header;
