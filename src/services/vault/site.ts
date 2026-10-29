import { doGet, doPost } from '@/services/httpClient';

export async function listSites(
  params: Vault.SiteListParams,
): Promise<Vault.SitePage> {
  return doGet('/vaultSite/list', params);
}

export async function createSite(data: Vault.SiteValues): Promise<Vault.Site> {
  return doPost('/vaultSite/create', data);
}

export async function editSite(
  data: Vault.SiteValues & { id: Vault.Site['id'] },
): Promise<boolean> {
  return doPost('/vaultSite/edit', data);
}

export async function deleteSite(id: Vault.Site['id']): Promise<boolean> {
  return doPost('/vaultSite/delete', { id });
}
