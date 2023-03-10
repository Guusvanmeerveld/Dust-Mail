import { MailBox as ServerMailBox } from "@dust-mail/structures";

type MailBox = ServerMailBox & { icon?: JSX.Element };

export default MailBox;
