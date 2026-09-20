import { request } from '@umijs/max';


export function getSystemLocales() {
  return request<System.SystemLocale[]>('/locale/systemLocals', { method: 'GET' });
}
