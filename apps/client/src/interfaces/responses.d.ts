type TokenType = "access_token" | "refresh_token";

export type Token = { type: TokenType; body: string; expires: Date };
export type LocalToken = Omit<Token, "type">;
export type LoginResponse = Token[];
