/**
 * @file 内部商品分类接口，分类树最多三级。
 */
import { doGet, doPost } from '@/services/httpClient';

/**
 * 查询有效分类树。同级按排序值、ID 升序排列。
 */
export const listCategories = (): Promise<Product.Category[]> =>
  doGet('/product/category/tree');

/**
 * 新增分类。顶级分类的 parentId 为 0，父级和编码在创建后固定。
 */
export const createCategory = (
  data: Product.CategoryValues & { code: string; parentId: Product.Id },
): Promise<Product.Category> => doPost('/product/category/create', data);

/**
 * 更新分类名称、排序和备注。改名会递增本分类及后代分类下的商品版本。
 */
export const updateCategory = (
  data: Product.CategoryValues & { id: Product.Id },
): Promise<Product.Category> => doPost('/product/category/update', data);

/**
 * 删除没有有效子分类或商品的分类。停用商品也会阻止删除。
 */
export const deleteCategory = (id: Product.Id): Promise<boolean> =>
  doPost('/product/category/delete', { id });
