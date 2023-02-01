import z from "zod";

import { MailBox as MailBoxModel } from "@models/mailbox";

type MailBox = z.infer<typeof MailBoxModel> & { icon?: JSX.Element };

export default MailBox;
