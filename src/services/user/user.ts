import { doGet } from '@/services/httpClient';

/**
 * 获取当前用户信息
 * @param options options
 */
export async function currentUser(options?: { [key: string]: any }): Promise<Oauth.CurrentUser> {
  return doGet('/user_server/user/currentUser', {}, options);
}
