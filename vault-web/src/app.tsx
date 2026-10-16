import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RequestConfig } from '@umijs/max';
import type { ReactNode } from 'react';

const ciphertextCache = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0, refetchOnWindowFocus: false },
    mutations: { retry: false, gcTime: 0 },
  },
});
export function rootContainer(container: ReactNode) {
  return (
    <QueryClientProvider client={ciphertextCache}>
      {container}
    </QueryClientProvider>
  );
}
export const request: RequestConfig = {
  timeout: 30000,
  errorConfig: { errorHandler: () => {} },
};
