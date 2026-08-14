import { doGet, doPost } from '@/services/httpClient';

/**
 * 添加菜单
 * @param data 菜单对象
 * @param options options
 */
export async function addMenu(data: System.Menu, options?: { [key: string]: any }) {
  return doPost('/system/menu/addMenu', data, options);
}

/**
 * 更新菜单
 * @param data 菜单对象
 * @param options options
 */
export async function updateMenu(data: System.Menu, options?: { [key: string]: any }) {
  return doPost('/system/menu/updateMenu', data, options);
}

/**
 * 查询顶级菜单列表
 * @param params 参数
 * @param options options
 */
export async function findTopLevelMenu(
  params: any,
  options?: { [key: string]: any },
): Promise<System.MenuPage> {
  return doGet('/system/menu/findTopLevelMenu', params, options);
}

/**
 * 根据父级id分页查询
 * @param parentId 父级id
 * @param options options
 */
export async function findByParentId(
  parentId: string,
  options?: { [key: string]: any },
): Promise<System.MenuVO[]> {
  return doGet('/system/menu/findByParentId', { parentId }, options);
}

/**
 * 删除菜单
 * @param data 删除对象
 * @param options options
 */
export async function deleteMenu(data: System.Menu, options?: { [key: string]: any }) {
  return doPost('/system/menu/del', data, options);
}
