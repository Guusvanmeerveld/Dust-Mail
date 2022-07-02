import sanitizeHtml from "sanitize-html";

const cleanMainHtml = (dirty: string): string =>
	sanitizeHtml(dirty, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat([
			"img",
			"style",
			"center"
		]),
		allowedAttributes: {
			...sanitizeHtml.defaults.allowedAttributes,
			// img: ["alt", "title", "width", "height", "loading"],
			"*": [
				"style",
				"width",
				"height",
				"border",
				"cellspacing",
				"cellpadding",
				"colspan",
				"id",
				"class",
				"align"
			]
		},
		allowVulnerableTags: true
	});

export const cleanTextHtml = (dirty: string): string => sanitizeHtml(dirty);

export default cleanMainHtml;
