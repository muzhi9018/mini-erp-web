import { doGet, doPost } from '@/services/httpClient';

/**
 * 获取当前用户信息
 * @param params 查询参数
 * @param options options
 */
export async function findByPage(params: Role.RoleQuery, options?: { [key: string]: any }): Promise<Role.RolePage> {
  return doGet('/system/role/findByPage', params, options);
}

/**
 * 添加角色
 * @param data 添加对象
 * @param options options
 */
export async function addRole(data: Role.Role,  options?: { [key: string]: any }): Promise<boolean> {
  return doPost('/system/role/addRole', data, options);
}

/**
 * 删除角色
 * @param data 删除对象
 * @param options options
 */
export async function delRole(data: Role.Role,  options?: { [key: string]: any }): Promise<boolean> {
  return doPost('/system/role/delRole', data, options);
}

/**
 * 编辑角色
 * @param data 编辑对象
 * @param options options
 */
export async function editRole(data: Role.Role,  options?: { [key: string]: any }): Promise<boolean> {
  return doPost('/system/role/editRole', data, options);
}

/**
 * 角色授权菜单详情
 * @param params 参数
 * @param options options
 */
export async function roleMenuDetail(params: Role.Role, options?: { [key: string]: any }): Promise<System.MenuVO[]> {
  return doGet('/system/role/roleMenuDetail', params, options);
}

/**
 * 角色授权
 * @param data 授权角色对象
 * @param options options
 */
export async function roleAuthorize(data: Role.Role, options?: { [key: string]: any }) {
  return doPost('/system/role/roleAuthorize', data, options);
}
