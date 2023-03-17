import create from "zustand";

import {
	IncomingMailServerTypeModel,
	OutgoingMailServerTypeModel,
	IncomingMailServerType,
	OutgoingMailServerType,
	IncomingServerType,
	OutgoingServerType,
	ServerType,
	MailServerType,
	ConnectionSecurity,
	LoginOptions
} from "@dust-mail/structures";

export type MultiServerLoginOptions = {
	password: string;
	username: string;
} & Omit<LoginOptions, "loginType">;

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

export const defaultIncomingServer: IncomingMailServerType = "Imap" as const;
export const defaultOutgoingServer: OutgoingMailServerType = "Smtp" as const;

export const defaultUsername = "" as const;
export const defaultPassword = "" as const;

export const defaultPorts: Record<MailServerType, number> = {
	Imap: 993,
	Pop: 995,
	Exchange: 443,
	Smtp: 465
} as const;

export const defaultSecuritySetting: ConnectionSecurity = "Tls";

const defaultImapConfig: MultiServerLoginOptions = {
	username: defaultUsername,
	password: defaultPassword,
	domain: "imap.example.com",
	security: defaultSecuritySetting,
	port: defaultPorts["Imap"]
};

const defaultExchangeConfig: MultiServerLoginOptions = {
	username: defaultUsername,
	password: defaultPassword,
	domain: "exchange.example.com",
	security: defaultSecuritySetting,
	port: defaultPorts["Exchange"]
};

const defaultPopConfig: MultiServerLoginOptions = {
	username: defaultUsername,
	password: defaultPassword,
	domain: "pop.example.com",
	security: defaultSecuritySetting,
	port: defaultPorts["Pop"]
};

const defaultSmtpConfig: MultiServerLoginOptions = {
	username: defaultUsername,
	password: defaultPassword,
	domain: "smtp.example.com",
	security: defaultSecuritySetting,
	port: defaultPorts["Smtp"]
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
			}
		})
}));

export default useMultiServerLoginStore;
