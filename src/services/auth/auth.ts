import { doPost, doGet } from '@/services/httpClient';

export async function login(
  data: Auth.LoginParam,
  options?: { [key: string]: any },
): Promise<Auth.CurrentUser> {
  return doPost('/auth/login', data, options);
}

export async function currentUser(options?: { [key: string]: any }): Promise<Auth.CurrentUser> {
  return doGet('/auth/currentUser', {}, options);
}
