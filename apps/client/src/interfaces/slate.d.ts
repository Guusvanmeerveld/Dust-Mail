import { BaseEditor } from "slate";
import { ReactEditor } from "slate-react";

export type CustomTextType = "paragraph" | "code";
export type CustomText = { text: string; bold?: boolean };
export type CustomElement = { type: CustomTextType; children: CustomText[] };

declare module "slate" {
	interface CustomTypes {
		Editor: BaseEditor & ReactEditor;
		Element: CustomElement;
		Text: CustomText;
	}
}
