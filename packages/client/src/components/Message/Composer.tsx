/* eslint-disable */
import useLocalStorageState from "use-local-storage-state";

import { Descendant, createEditor, Transforms, Text, Editor } from "slate";
import { Editable, Slate, withReact } from "slate-react";

import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { ComponentChildren, FunctionalComponent, JSX } from "preact";

import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { CustomElement, CustomText } from "@interfaces/slate";

import modalStyles from "@styles/modal";

import useStore from "@utils/hooks/useStore";
import useTheme from "@utils/hooks/useTheme";

const isBoldMarkActive = (editor: Editor) => {
	const [match] = Editor.nodes(editor, {
		match: (n: any) => n.bold === true,
		universal: true
	});

	return !!match;
};

const isCodeBlockActive = (editor: Editor) => {
	const [match] = Editor.nodes(editor, {
		match: (n: any) => n.type === "code"
	});

	return !!match;
};

const toggleBoldMark = (editor: Editor) => {
	const isActive = isBoldMarkActive(editor);

	Transforms.setNodes(
		editor,
		{ bold: !isActive },
		{ match: (n) => Text.isText(n), split: true }
	);
};

const toggleCodeBlock = (editor: Editor) => {
	const isActive = isCodeBlockActive(editor);

	Transforms.setNodes(
		editor,
		{ type: isActive ? "paragraph" : "code" },
		{ match: (n) => Editor.isBlock(editor, n) }
	);
};

const isMarkActive = (
	editor: Editor,
	format: keyof Omit<CustomText, "text">
) => {
	const marks = Editor.marks(editor);
	return marks ? marks[format] === true : false;
};

const toggleMark = (editor: Editor, format: keyof Omit<CustomText, "text">) => {
	const isActive = isMarkActive(editor, format);

	if (isActive) {
		Editor.removeMark(editor, format);
	} else {
		Editor.addMark(editor, format, true);
	}
};

const CodeElement: FunctionalComponent<{
	attributes: Record<string, unknown>;
}> = (props) => (
	<pre {...props.attributes}>
		<code>{props.children}</code>
	</pre>
);

const DefaultElement: FunctionalComponent<{
	attributes: Record<string, unknown>;
}> = (props) => <p {...props.attributes}>{props.children}</p>;

const Leaf: FunctionalComponent<{
	leaf: Omit<CustomText, "text">;
	attributes: Record<string, unknown>;
}> = (props) => (
	<span
		{...props.attributes}
		style={{ fontWeight: props.leaf.bold ? "bold" : "normal" }}
	>
		{props.children}
	</span>
);

const TextEditor: FunctionalComponent<{ initialValue?: string }> = ({
	initialValue
}) => {
	const [value, setValue] = useState<Descendant[]>([
		{
			type: "paragraph",
			children: [{ text: initialValue ?? "" }]
		}
	]);

	const renderElement = useCallback<
		(props: {
			element: CustomElement;
			attributes: Record<string, unknown>;
			children: ComponentChildren;
		}) => JSX.Element
	>((props) => {
		switch (props.element.type) {
			case "code":
				return <CodeElement {...props} />;
			default:
				return <DefaultElement {...props} />;
		}
	}, []);

	const renderLeaf = useCallback<
		(props: {
			leaf: { bold: boolean };
			children: ComponentChildren;
			attributes: Record<string, unknown>;
		}) => JSX.Element
	>((props) => {
		return <Leaf {...props} />;
	}, []);

	const editor = useMemo(() => withReact(createEditor()), []);

	return (
		<Slate editor={editor} value={value} onChange={(value) => setValue(value)}>
			<Editable
				renderElement={renderElement}
				renderLeaf={renderLeaf}
				onKeyDown={(event: KeyboardEvent) => {
					if (!event.ctrlKey) {
						return;
					}

					switch (event.key) {
						// When "`" is pressed, keep our existing code block logic.
						case "`": {
							event.preventDefault();

							toggleCodeBlock(editor);

							break;
						}

						// When "B" is pressed, bold the text in the selection.
						case "b": {
							event.preventDefault();

							toggleBoldMark(editor);

							break;
						}
					}
				}}
			/>
		</Slate>
	);
};

const MessageComposer: FunctionalComponent = () => {
	const theme = useTheme();

	const location = useLocation();
	const navigate = useNavigate();
	let [searchParams] = useSearchParams();

	const [displayName, setDisplayName] = useLocalStorageState("displayName", {
		defaultValue: { displayName: "", askAgain: true }
	});

	const [to, setTo] = useState<string | void>();
	const [body, setBody] = useState<string | undefined>(undefined);
	const [subject, setSubject] = useState<string | void>();

	const showMessageComposer =
		useStore((state) => state.showMessageComposer) ||
		location.pathname == "/dashboard/compose";

	const setShowMessageComposer = useStore(
		(state) => state.setShowMessageComposer
	);

	useEffect(() => {
		if (showMessageComposer) {
			document.title = `${import.meta.env.VITE_APP_NAME} - Compose`;
		}
	}, [showMessageComposer]);

	if (!showMessageComposer) return <></>;

	const uriParam = searchParams.get("uri");

	useEffect(() => {
		if (uriParam) {
			try {
				const uri = new URL(uriParam);

				if (uri.searchParams.has("body")) {
					setBody(uri.searchParams.get("body")!);
				}

				if (uri.searchParams.has("subject")) {
					setSubject(uri.searchParams.get("subject")!);
				}

				if (uri.pathname && uri.pathname.length != 0) setTo(uri.pathname);
			} catch {}
		}
	}, [uriParam]);

	return (
		<Modal
			open={showMessageComposer}
			onClose={() => {
				if (location.pathname == "/dashboard/compose") navigate("/dashboard");

				document.title = import.meta.env.VITE_APP_NAME;

				setShowMessageComposer(false);
			}}
		>
			<Box sx={modalStyles(theme)}>
				<Stack direction="column" spacing={2}>
					<Typography gutterBottom variant="h4">
						Compose a new message
					</Typography>
					<TextField
						label="To"
						fullWidth
						value={to}
						onChange={(e) => setTo(e.currentTarget.value)}
					/>
					<TextField
						label="Subject"
						fullWidth
						value={subject}
						onChange={(e) => setSubject(e.currentTarget.value)}
					/>
					{/* <TextEditor initialValue={body} /> */}
				</Stack>
			</Box>
		</Modal>
	);
};

export default MessageComposer;
