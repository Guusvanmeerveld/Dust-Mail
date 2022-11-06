import { load } from "cheerio";
import { readFileSync } from "fs-extra";
import { minify } from "html-minifier";
import { join } from "path";
import sanitizeHtml from "sanitize-html";

const darkModeStyles = readFileSync(join(process.cwd(), "public", "dark.css"));

const cleanMainHtml = (
	dirty: string,
	noImages: boolean,
	darkMode: boolean
): string => {
	const imgAttributes = ["alt", "title", "width", "height", "loading"];

	if (!noImages) imgAttributes.push("src");

	let html = sanitizeHtml(dirty, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat([
			"img",
			"style",
			"center"
		]),
		allowedAttributes: {
			...sanitizeHtml.defaults.allowedAttributes,
			img: imgAttributes,
			"*": [
				"style",
				"width",
				"height",
				"border",
				"cellspacing",
				"cellpadding",
				"colspan",
				"id",
				"target",
				"data-x-style-url",
				"class",
				"align"
			]
		},
		allowVulnerableTags: true
	});

	const $ = load(html);

	if (darkMode) {
		$("head").append(`<style>${darkModeStyles.toString()}</style>`);
	}

	$("a").attr("target", "_blank");

	html = $.html();

	if (!html.startsWith("<!DOCTYPE html>")) html = `<!DOCTYPE html>${html}`;

	html = minify(html);

	return html;
};

export const cleanTextHtml = (dirty: string): string => sanitizeHtml(dirty);

export default cleanMainHtml;
