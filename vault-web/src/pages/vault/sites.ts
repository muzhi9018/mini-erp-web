import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { normalizeDomain } from '@/security/vault/domain';
import { listSites } from '@/services/vault/site';

export const OTHER_SITE = '__other__';

export function useSites() {
  const query = useQuery({
    queryKey: ['vault-sites'],
    queryFn: ({ signal }) => listSites(signal),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
  });
  const { refetch } = query;
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) void refetch({ cancelRefetch: false });
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refetch]);
  return query;
}

export function matchSite(sites: Vault.Site[], website: string) {
  const domain = normalizeDomain(website);
  return domain
    ? sites.find((site) => normalizeDomain(site.siteDomain) === domain)
    : undefined;
}
