/**
 * @file 内部商品管理接口，覆盖档案、图片、结构化规格、SKU 和库存。
 */
import { doGet, doPost, doPostFrom } from '@/services/httpClient';

/**
 * 分页查询商品。关键字匹配商品名称、编码和 SKU 货号、型号，分类筛选包含后代分类。
 */
export const listProducts = (
  params: Product.Query,
): Promise<Product.Page<Product.Item>> => doGet('/product/list', params);

/**
 * 获取完整管理详情，包含商品图片、规格候选值和所属 SKU。
 */
export const getProduct = (productId: Product.Id): Promise<Product.Detail> =>
  doGet('/product/detail', { productId });

/**
 * 一次提交商品资料、图片、规格和至少一条 SKU，由后端在同一事务内保存。
 */
export const createProduct = (data: Product.Create): Promise<Product.Detail> =>
  doPost('/product/create', data);

/**
 * 更新商品共同资料。expectedVersion 使用详情返回的商品版本。
 */
export const updateProduct = (
  data: Product.Values & Product.VersionedId,
): Promise<Product.Item> => doPost('/product/update', data);

/**
 * 切换商品启停状态，使用商品版本。
 */
export const changeProductStatus = (
  data: Product.VersionedId & { status: Product.Status },
): Promise<Product.Item> => doPost('/product/change-status', data);

/**
 * 删除所有 SKU 库存均为零的商品及其附属资料，返回删除后的商品版本。
 */
export const deleteProduct = (data: Product.VersionedId): Promise<number> =>
  doPost('/product/delete', data);

/**
 * 保存商品完整图片列表，数组顺序即展示顺序。传空数组清除图片关联。
 */
export const saveImages = (
  data: Product.VersionedId & { images: Product.ImageInput[] },
): Promise<{
  productId: Product.Id;
  productVersion: number;
  images: Product.Image[];
}> => doPost('/product/images/save', data);

/**
 * 上传商品或 SKU 图片附件。保存图片时再用返回的附件 ID 建立关联。
 */
export const uploadProductImage = (file: File): Promise<System.Attachment> =>
  doPostFrom('/attachment/upload', { file, model: 'PRODUCT' });

/**
 * 新增维度及候选值。商品已有 SKU 时不能新增维度。
 */
export const createSpec = (
  data: Product.SpecInput & { productId: Product.Id; expectedVersion: number },
): Promise<Product.Spec> => doPost('/product/spec/create', data);

/**
 * 修改维度名称和排序，使用所属商品的版本。
 */
export const updateSpec = (
  data: Product.VersionedId & { name: string; sortOrder: number },
): Promise<Product.Spec> => doPost('/product/spec/update', data);

/**
 * 删除维度。id 是规格 ID，expectedVersion 是所属商品版本。
 */
export const deleteSpec = (data: Product.VersionedId): Promise<void> =>
  doPost('/product/spec/delete', data);

/**
 * 为指定维度新增候选值，使用所属商品的版本。
 */
export const createSpecValue = (
  data: Product.SpecValueInput & {
    specId: Product.Id;
    expectedVersion: number;
  },
): Promise<Product.SpecValue> => doPost('/product/spec/value/create', data);

/**
 * 编辑候选值。已被 SKU 使用的值只能调整排序。
 */
export const updateSpecValue = (
  data: Product.SpecValueInput & Product.VersionedId,
): Promise<Product.SpecValue> => doPost('/product/spec/value/update', data);

/**
 * 删除未被 SKU 使用的候选值，使用所属商品的版本。
 */
export const deleteSpecValue = (data: Product.VersionedId): Promise<void> =>
  doPost('/product/spec/value/delete', data);

/**
 * 分页查询管理用 SKU，支持货号、状态和结构化规格筛选。
 * 规格条件按 Spring 所需的 `specs[0].specId` 格式传递。省略空值并保留数值 0。
 */
export function listSkus(
  params: Product.SkuQuery,
): Promise<Product.Page<Product.Sku>> {
  const { specs, ...query } = params;
  const filters: Record<string, Product.Decimal> = {};

  specs?.forEach((spec, index) => {
    for (const [key, value] of Object.entries(spec)) {
      if (value != null && value !== '')
        filters[`specs[${index}].${key}`] = value;
    }
  });
  return doGet('/product/sku/list', { ...query, ...filters });
}

/**
 * 只计算候选值组合，供保存前预览。须覆盖每个维度，单次最多 1000 个组合。
 */
export const previewSkus = (
  productId: Product.Id,
  dimensions: { specId: Product.Id; specValueIds: Product.Id[] }[],
): Promise<Product.Selection[][]> =>
  doPost('/product/sku/preview', { productId, dimensions });

/**
 * 为已有商品批量新增 SKU。规格选择使用数据库 ID，版本使用商品版本。
 */
export const createSkus = (
  data: Product.VersionedId & { skus: Product.SkuInput[] },
): Promise<Product.Sku[]> => doPost('/product/sku/create', data);

/**
 * 更新 SKU 资料，使用 SKU 行版本。现有库存必须能用提交的精度准确表示。
 */
export const updateSku = (
  data: Product.VersionedId &
    Omit<Product.SkuValues, 'code' | 'stockQuantity' | 'status'>,
): Promise<Product.SkuResult> => doPost('/product/sku/update', data);

/**
 * 保存 SKU 自身的完整图片列表，返回新的 SKU 版本和商品版本。
 */
export const saveSkuImages = (
  data: Product.VersionedId & {
    images: Product.ImageInput[];
  },
): Promise<{
  skuId: Product.Id;
  skuVersion: number;
  productVersion: number;
  images: Product.Image[];
}> => doPost('/product/sku/images/save', data);

/**
 * 切换 SKU 自身的启停状态，使用 SKU 行版本。
 */
export const changeSkuStatus = (
  data: Product.VersionedId & { status: Product.Status },
): Promise<Product.SkuResult> => doPost('/product/sku/change-status', data);

/**
 * 删除零库存 SKU，保留历史快照。
 */
export const deleteSku = (
  data: Product.VersionedId,
): Promise<Product.SkuResult> => doPost('/product/sku/delete', data);

/**
 * 将当前库存设置为指定总量。校验小数位时忽略末尾零，超过 SKU 精度则拒绝。
 */
export const setStock = (
  data: Product.VersionedId & { stockQuantity: Product.Decimal },
): Promise<Product.SkuResult> => doPost('/product/sku/stock/set', data);
