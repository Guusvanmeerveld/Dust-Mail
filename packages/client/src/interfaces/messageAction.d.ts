export default interface MessageAction {
	name: string;
	icon: JSX.Element;
	handler: () => void;
}
