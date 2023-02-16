import { z } from "zod";
import create from "zustand";

import { AuthType as AuthTypeModel } from "@models/config";
import {
	IncomingServerType as IncomingServerTypeModel,
	OutgoingServerType as OutgoingServerTypeModel,
	IncomingMailServerType as IncomingMailServerTypeModel,
	OutgoingMailServerType as OutgoingMailServerTypeModel
} from "@models/login";

import MultiServerLoginOptions, {
	ConnectionSecurity,
	IncomingMailServerType,
	MailServerType,
	OutgoingMailServerType,
	ServerType
} from "@interfaces/login";

type IncomingServerType = z.infer<typeof IncomingServerTypeModel>;
type OutgoingServerType = z.infer<typeof OutgoingServerTypeModel>;

type Store = Record<
	IncomingServerType,
	Record<IncomingMailServerType, MultiServerLoginOptions>
> &
	Record<
		OutgoingServerType,
		Record<OutgoingMailServerType, MultiServerLoginOptions>
	> & {
		showMenu: boolean;
		setShowMenu: (show: boolean) => void;
		provider?: string;
		setProvider: (provider?: string) => void;
		selectedMailServerType: Record<IncomingServerType, IncomingMailServerType> &
			Record<OutgoingServerType, OutgoingMailServerType>;
		setSelectedMailServerType: (
			type: ServerType,
			mailType: MailServerType
		) => void;
		error?: string;
		setError: (error?: string) => void;
		setLoginOptions: (
			type: ServerType,
			mailType: MailServerType,
			options: Partial<MultiServerLoginOptions>
		) => void;
		resetToDefaults: () => void;
		setLoginOptionsProperty: (
			type: ServerType,
			mailType: MailServerType
		) => (
			property: keyof MultiServerLoginOptions
		) => (newValue?: string | number) => void;
	};

export const defaultIncomingServer: IncomingMailServerType = "Imap";
export const defaultOutgoingServer: OutgoingMailServerType = "Smtp";

export const defaultUsername = "";
export const defaultPassword = "";

export const defaultPorts: Record<MailServerType, number> = {
	Imap: 993,
	Pop: 995,
	Exchange: 443,
	Smtp: 465
};

export const defaultSecuritySetting: ConnectionSecurity = "Tls";

const defaultLoginTypes: z.infer<typeof AuthTypeModel>[] = ["ClearText"];

const defaultImapConfig: MultiServerLoginOptions = {
	password: defaultPassword,
	username: defaultUsername,
	domain: "imap.example.com",
	security: defaultSecuritySetting,
	port: defaultPorts["Imap"],
	loginType: defaultLoginTypes
};

const defaultExchangeConfig: MultiServerLoginOptions = {
	password: defaultPassword,
	username: defaultUsername,
	domain: "exchange.example.com",
	security: defaultSecuritySetting,
	port: defaultPorts["Exchange"],
	loginType: defaultLoginTypes
};

const defaultPopConfig: MultiServerLoginOptions = {
	password: defaultPassword,
	username: defaultUsername,
	domain: "pop.example.com",
	security: defaultSecuritySetting,
	port: defaultPorts["Pop"],
	loginType: defaultLoginTypes
};

const defaultSmtpConfig: MultiServerLoginOptions = {
	password: defaultPassword,
	username: defaultUsername,
	domain: "smtp.example.com",
	security: defaultSecuritySetting,
	port: defaultPorts["Smtp"],
	loginType: defaultLoginTypes
};

export const defaultConfigs = {
	incoming: {
		Imap: defaultImapConfig,
		Exchange: defaultExchangeConfig,
		Pop: defaultPopConfig
	},
	outgoing: {
		Smtp: defaultSmtpConfig
	}
};

const useMultiServerLoginStore = create<Store>((set) => ({
	...defaultConfigs,
	showMenu: false,
	setShowMenu: (show) => set({ showMenu: show }),
	provider: undefined,
	setProvider: (provider) => set({ provider }),
	error: undefined,
	setError: (error) => set({ error }),
	selectedMailServerType: {
		incoming: defaultIncomingServer,
		outgoing: defaultOutgoingServer
	},
	setSelectedMailServerType: (type, mailType) =>
		set((state) => ({
			selectedMailServerType: {
				...state.selectedMailServerType,
				[type]: mailType
			}
		})),
	setLoginOptions: (type, mailType, options) => {
		set((state) => ({
			[type]: {
				...state[type],
				[mailType]: options
			}
		}));
	},
	resetToDefaults: () =>
		set({
			...defaultConfigs,
			provider: undefined,
			selectedMailServerType: {
				incoming: defaultIncomingServer,
				outgoing: defaultOutgoingServer
			}
		}),
	setLoginOptionsProperty: (type, mailType) => (property) => (newValue) =>
		set((state) => {
			switch (type) {
				case "incoming":
					// eslint-disable-next-line no-case-declarations
					const incomingMailType = IncomingMailServerTypeModel.parse(mailType);

					return {
						[type]: {
							...state[type],
							[mailType]: {
								...state[type][incomingMailType],
								[property]: newValue
							}
						}
					};

				case "outgoing":
					// eslint-disable-next-line no-case-declarations
					const outgoingMailType = OutgoingMailServerTypeModel.parse(mailType);

					return {
						[type]: {
							...state[type],
							[mailType]: {
								...state[type][outgoingMailType],
								[property]: newValue
							}
						}
					};
					break;
			}
		})
}));

export default useMultiServerLoginStore;
