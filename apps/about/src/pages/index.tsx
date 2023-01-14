import { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import styles from "./Index.module.scss";

import axios from "axios";

import { Sponsor } from "@interfaces/sponsor";
import { Asset } from "@interfaces/version";

import Footer from "@components/Footer";
import Header from "@components/Header";
import Layout from "@components/Layout";

const Index: NextPage<{
	latestVersion: { assets: Asset[] };
	sponsors: Sponsor[];
}> = ({ latestVersion, sponsors }) => {
	const badgeScale = 0.4;

	const badgeWidth = 564 * badgeScale;
	const badgeHeight = 168 * badgeScale;

	const windowsDownload = latestVersion.assets.find((asset) =>
		asset.name.endsWith(".msi")
	);

	const osxDownload = latestVersion.assets.find((asset) =>
		asset.name.endsWith(".dmg")
	);

	const linuxDownload = latestVersion.assets.find((asset) =>
		asset.name.endsWith(".AppImage")
	);

	return (
		<Layout title="Home">
			<Header
				title="A simple and fast email client"
				description="A simple and fast email client for the web and desktop, built using
				React, Tauri and Nestjs."
			/>
			<main>
				<div className={styles.images}>
					{windowsDownload && (
						<Link href={windowsDownload.url} passHref>
							<a>
								<Image
									alt="windows-download-button"
									src="/badge-windows.png"
									width={badgeWidth}
									height={badgeHeight}
								/>
							</a>
						</Link>
					)}
					{osxDownload && (
						<Link href={osxDownload.url} passHref>
							<a>
								<Image
									alt="macos-download-button"
									src="/badge-osx.png"
									width={badgeWidth}
									height={badgeHeight}
								/>
							</a>
						</Link>
					)}
					{linuxDownload && (
						<Link href={linuxDownload.url} passHref>
							<a>
								<Image
									alt="linux-download-button"
									src="/badge-linux.png"
									width={badgeWidth}
									height={badgeHeight}
								/>
							</a>
						</Link>
					)}
				</div>
				<h2>What is Dust-Mail?</h2>
				Dust-Mail is an email client for the web, desktop and soon to be mobile,
				that can connect to any imap or smtp mail server. For example if you
				have a Microsoft @outlook.com address, you can login by using your
				username and password. Google login is also supported, by using an oauth
				login. Currently there is no support for Pop3, JMAP or Protonmail, but
				there are plans to add this in the future.
				<h2>Why use Dust-Mail?</h2>
				Dust-Mail is an open-source, free and ad-free email client, providing
				full insight to the end user on what is happening to your data. Even
				though Dust-Mail uses a client-server architecture, you can, with
				relative ease, choose to host the server on your own hardware, further
				increasing this control over your own data. Furthermore, it is (will be)
				a fully featured email client supporting all the protocols/email
				services that one could want.
				<h5>
					Are you enjoying Dust-Mail? Consider making a{" "}
					<Link
						href={`https://github.com/sponsors/${process.env.NEXT_PUBLIC_GITHUB_USERNAME}`}
					>
						<a>donation</a>
					</Link>
					.
				</h5>
				<h2>How do I set it up?</h2>
				If you don&apos;t care about where your data gets stored, you can use
				the web hosted version, but for more advanced users, I would recommend
				setting up a Dust-Mail server of your own. To do so, check out the{" "}
				<Link href={`https://docs.${process.env.NEXT_PUBLIC_DOMAIN}`}>
					<a>docs</a>
				</Link>
				.<h2>Features</h2>
				<label>
					<input type="checkbox" checked readOnly />
					Multiple accounts
				</label>
				<label>
					<input type="checkbox" checked readOnly />
					IMAP
				</label>
				<label>
					<input type="checkbox" checked readOnly />
					STMP
				</label>
				<label>
					<input type="checkbox" checked={false} readOnly />
					XOauth for IMAP
				</label>
				<label>
					<input type="checkbox" checked={false} readOnly />
					POP3
				</label>
				<label>
					<input type="checkbox" checked={false} readOnly />
					Gmail
				</label>
				<label>
					<input type="checkbox" checked={false} readOnly />
					JMAP
				</label>
				<label>
					<input type="checkbox" checked={false} readOnly />
					Protonmail
				</label>
				<label>
					<input type="checkbox" checked={false} readOnly />
					Webdav/Webcal
				</label>
				<label>
					<input type="checkbox" checked={false} readOnly />
					iCal
				</label>
				<h2>Sponsors</h2>
				<p>Thank you to everyone who is/was sponsoring the project &lt;3!</p>
				{sponsors.map((sponsor) => (
					<Link key={sponsor.username} href={sponsor.url}>
						<a style={{ marginRight: ".5rem" }}>
							<Image
								alt={sponsor.username}
								src={sponsor.avatar}
								width={50}
								height={50}
								style={{ borderRadius: "50%" }}
							/>
						</a>
					</Link>
				))}
			</main>
			<Footer />
		</Layout>
	);
};

export const getStaticProps: GetStaticProps = async () => {
	const { data: assets } = await axios.get<{
		assets: { name: string; browser_download_url: string }[];
	}>(
		`https://api.github.com/repos/${process.env.NEXT_PUBLIC_GITHUB_USERNAME}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/releases/latest`
	);

	const { data: sponsors } = await axios.get<{
		sponsors: {
			handle: string;
			avatar: string;
			details: { html_url?: string };
		}[];
	}>(
		`https://ghs.vercel.app/sponsors/${process.env.NEXT_PUBLIC_GITHUB_USERNAME}`
	);

	return {
		props: {
			latestVersion: {
				assets: assets.assets.map((asset) => ({
					url: asset.browser_download_url,
					name: asset.name
				}))
			},
			sponsors: sponsors.sponsors.map((sponsor) => ({
				avatar: sponsor.avatar,
				username: sponsor.handle,
				url: sponsor.details.html_url ?? `https://github.com/${sponsor.handle}`
			}))
		},
		revalidate: 10 * 60
	};
};

export default Index;
