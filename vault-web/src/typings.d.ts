declare module '*.css';

declare const VAULT_API_BASE_URL: string;

declare const VAULT_AUTO_LOCK: Readonly<{
  idleMinutes: number;
  backgroundSeconds: number;
}>;
