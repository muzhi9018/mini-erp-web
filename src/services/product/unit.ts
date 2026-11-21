/**
 * @file 内部计量单位接口，供 SKU 和数值规格引用。
 */
import { doGet, doPost } from '@/services/httpClient';

/**
 * 查询计量单位列表。数量小数位随 SKU 返回。
 */
export const listUnits = (): Promise<Product.Unit[]> =>
  doGet('/product/unit/list');

/**
 * 新增计量单位。编码在创建后固定。
 */
export const createUnit = (data: Product.UnitValues): Promise<Product.Unit> =>
  doPost('/product/unit/create', data);

/**
 * 更新单位名称和排序。改名会递增受影响的商品版本。
 */
export const updateUnit = (
  data: Omit<Product.Unit, 'code'>,
): Promise<Product.Unit> => doPost('/product/unit/update', data);
/**
 * 删除未被有效商品资料引用的单位。
 */
export const deleteUnit = (id: Product.Id): Promise<void> =>
  doPost('/product/unit/delete', { id });
