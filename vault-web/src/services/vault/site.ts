import { doGet } from '@/services/httpClient';

export const listSites = (signal?: AbortSignal) =>
  doGet<Vault.Site[]>('/vault/api/site/list', undefined, signal);
