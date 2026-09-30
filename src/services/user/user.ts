import { doGet, doPost } from '@/services/httpClient';

/**
 * 获取当前用户信息
 * @param options options
 */
export async function currentUser(options?: { [key: string]: any }): Promise<Oauth.CurrentUser> {
  return doGet('/user_server/user/currentUser', {}, options);
}

export async function findUsersByPage(
  params: User.SysUserQuery,
): Promise<Common.BasePage & { records: User.SysUser[] }> {
  return doGet('/system/user/findByPage', params);
}

export async function createUser(data: User.CreateSysUser): Promise<void> {
  return doPost('/system/user/create', data);
}

export async function authorizeUserRole(data: User.AuthorizeRole): Promise<boolean> {
  return doPost('/system/user/authorize/role', data);
}

export async function resetUserPassword(userId: string): Promise<string> {
  return doPost('/system/user/reset/password', { id: userId });
}
