import crypto from "crypto";
import { ensureFile, readFile, writeFile } from "fs-extra";
import { join } from "path";

import { Injectable } from "@nestjs/common";

import { getSecretsDir } from "@src/constants";
import generateRandomPassword from "@src/utils/createPassword";

export interface EncryptedData {
	iv: string;
	data: string;
}

@Injectable()
export class CryptoService {
	private readonly iv = crypto.randomBytes(16);

	private async getPassphrase(): Promise<string> {
		const passphraseLocation = join(getSecretsDir(), "passphrase");

		await ensureFile(passphraseLocation);

		const contents = await readFile(passphraseLocation).then((data) =>
			data.length != 0 ? data.toString("utf-8") : false
		);

		if (contents) return contents;
		else {
			const password = await generateRandomPassword(32);

			await writeFile(passphraseLocation, password);

			return password;
		}
	}

	public async encryptTokenPayload<T>(payload: T): Promise<EncryptedData> {
		const passphrase = await this.getPassphrase();

		const cipher = crypto.createCipheriv(
			"aes-256-cbc",
			Buffer.from(passphrase),
			this.iv
		);

		let encrypted = cipher.update(JSON.stringify(payload));
		encrypted = Buffer.concat([encrypted, cipher.final()]);

		return {
			iv: this.iv.toString("hex"),
			data: encrypted.toString("hex")
		};
	}

	public async decryptTokenPayload<T>(payload: EncryptedData): Promise<T> {
		const passphrase = await this.getPassphrase();

		const iv = Buffer.from(payload.iv, "hex");

		const encrypted = Buffer.from(payload.data, "hex");

		const decipher = crypto.createDecipheriv(
			"aes-256-cbc",
			Buffer.from(passphrase),
			iv
		);
		let decrypted = decipher.update(encrypted);

		decrypted = Buffer.concat([decrypted, decipher.final()]);

		return JSON.parse(decrypted.toString());
	}
}
