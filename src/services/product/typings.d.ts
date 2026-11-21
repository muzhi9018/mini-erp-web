/**
 * @file 内部商品管理接口的请求、响应和表单类型。
 */
declare namespace Product {
  /**
   * 后端长整型 ID。收到字符串 ID 时原样传递，避免超出 JavaScript 安全整数范围。
   */
  type Id = string | number;

  /**
   * 库存、金额和数值规格。表单可用字符串保留十进制精度。
   */
  type Decimal = string | number;

  /**
   * 后端支持的参考价币种。采购价和售价的币种分别维护。
   */
  type Currency = 'CNY' | 'TWD';

  /**
   * 启停状态。商品与所属 SKU 分别维护各自的状态。
   */
  type Status = 'ENABLED' | 'DISABLED';

  /**
   * 携带版本的写操作参数。版本冲突后需刷新资料并重新确认。
   */
  type VersionedId = {
    /**
     * 目标记录的 ID，可以是商品、规格、候选值或 SKU。
     */
    id: Id;
    /**
     * SKU 单条维护使用 SKU 行版本，商品或规格维护及批量新增 SKU 使用商品版本。
     */
    expectedVersion: number;
  };

  /**
   * 分类树节点，叶节点的 children 为空数组。
   */
  type Category = {
    id: Id;
    /**
     * 顶级分类使用 0。父级在创建后固定。
     */
    parentId: Id;
    code: string;
    name: string;
    sortOrder: number;
    remark?: string | null;
    children: Category[];
  };

  /**
   * 创建和编辑分类时共用的资料字段。
   */
  type CategoryValues = Pick<Category, 'name' | 'sortOrder' | 'remark'>;

  /**
   * 计量单位资料，供 SKU 或数值规格引用。
   */
  type Unit = {
    id: Id;
    code: string;
    name: string;
    sortOrder: number;
  };

  /**
   * 新增计量单位的字段，包含创建后固定的单位编码。
   */
  type UnitValues = Omit<Unit, 'id'>;

  /**
   * 图片保存请求中的关联项，数组顺序即展示顺序。
   */
  type ImageInput = { attachmentId: Id; isCover: boolean };

  /**
   * 前端图片草稿，可携带上传后用于预览的地址。
   */
  type ImageDraft = ImageInput & { url?: string };

  /**
   * 后端返回的图片关联及预览地址。ownerId 由 imageType 决定。
   */
  type Image = ImageDraft & {
    imageType: 'PRODUCT' | 'SKU';
    ownerId: Id;
  };

  /**
   * 规格候选值。文本或数值按所属维度类型填写，两者互斥。
   */
  type SpecValueInput = {
    textValue?: string;
    numberValue?: Decimal;
    sortOrder?: number;
  };

  /**
   * 已保存的候选值，包含自身 ID 和所属维度 ID。
   */
  type SpecValue = SpecValueInput & { id: Id; specId: Id };

  /**
   * 新增规格维度时使用的资料及候选值。
   */
  type SpecInput = {
    name: string;
    valueType: 'TEXT' | 'NUMBER';
    /**
     * 数值维度可以关联计量单位。
     */
    unitId?: Id | null;
    sortOrder: number;
    /**
     * 完整建档时，同一维度下的候选值可用唯一的 clientKey 供 SKU 引用。
     */
    values: (SpecValueInput & { clientKey?: string })[];
    /**
     * 完整建档时的临时维度键，在一次请求内唯一。
     */
    clientKey?: string;
  };

  /**
   * 已保存的规格维度及其候选值。
   */
  type Spec = Omit<SpecInput, 'values'> & {
    id: Id;
    productId: Id;
    values: SpecValue[];
  };

  /**
   * 使用数据库 ID 表示某个规格维度下选中的候选值。
   */
  type Selection = { specId: Id; specValueId: Id };

  /**
   * SKU 表单字段。采购价、售价各自与对应币种成对填写或留空。
   */
  type SkuValues = {
    code: string;
    model?: string | null;
    unitId: Id;
    /**
     * 数量小数位为 0～6。空值在新增时按 0 保存，编辑时保留原值。
     */
    quantityScale?: number | null;
    images?: ImageDraft[];
    referencePurchasePrice?: Decimal | null;
    referencePurchaseCurrency?: Currency | null;
    referenceSalePrice?: Decimal | null;
    referenceSaleCurrency?: Currency | null;
    /**
     * 建档时的初始库存。已建档 SKU 的库存通过独立库存接口设置。
     */
    stockQuantity?: Decimal;
    status: Status;
    sortOrder?: number;
  };

  /**
   * 建档或批量新增 SKU 的请求项。有规格时必须为每个维度选一个候选值。
   */
  type SkuInput = SkuValues & {
    /**
     * 完整建档时，引用同一请求内的临时维度键和候选值键。
     */
    selections?: { specClientKey: string; valueClientKey: string }[];
    /**
     * 给已有商品新增 SKU 时，引用已保存的维度 ID 和候选值 ID。
     */
    specValues?: Selection[];
  };

  /**
   * 管理详情和 SKU 列表返回的 SKU 资料及显示字段。
   */
  type Sku = SkuValues & {
    id: Id;
    productId: Id;
    /**
     * SKU 行版本，用于单条 SKU 的写操作。
     */
    version: number;
    stockQuantity: Decimal;
    unitName: string;
    quantityScale: number;
    /**
     * SKU 自身图片。为空时，界面从商品资料获取主图。
     */
    images: Image[];
    specificationText?: string;
    specValues: (Selection & {
      specName?: string;
      textValue?: string;
      numberValue?: Decimal;
      unitName?: string;
    })[];
  };

  /**
   * 新建和编辑商品时共用的档案字段。
   */
  type Values = {
    name: string;
    categoryId: Id;
    brand?: string | null;
    description?: string | null;
    sortOrder: number;
  };

  /**
   * 商品分页记录，包含 SKU 数量和商品主图地址。
   */
  type Item = Values & {
    id: Id;
    code: string;
    status: Status;
    /**
     * 商品版本。商品档案、规格或所属 SKU 更新后会递增。
     */
    version: number;
    categoryName?: string;
    skuCount: number;
    coverImageUrl?: string;
    gmtModified?: string;
  };

  /**
   * 完整商品资料，包含商品图片、规格和所属 SKU。
   */
  type Detail = Item & { images: Image[]; specs: Spec[]; skus: Sku[] };

  /**
   * 完整建档请求，至少提交一条 SKU。
   */
  type Create = Values & {
    code: string;
    status: Status;
    images: ImageInput[];
    specs: SpecInput[];
    skus: SkuInput[];
  };

  /**
   * 商品分页查询参数。status 筛选的是商品状态。
   */
  type Query = {
    pageNum: number;
    pageSize: number;
    keyword?: string;
    categoryId?: Id;
    status?: Status;
  };

  /**
   * 单个维度的筛选条件。指定候选值与数值区间互斥，数值区间包含边界。
   */
  type SpecFilter = {
    specId: Id;
    specValueId?: Id;
    minimum?: Decimal;
    maximum?: Decimal;
  };

  /**
   * 管理用 SKU 查询参数。指定多个规格条件时，每个条件都须满足。
   */
  type SkuQuery = Query & {
    productId?: Id;
    skuStatus?: Status;
    specs?: SpecFilter[];
  };

  /**
   * SKU 编辑、启停、删除或库存设置返回的库存及最新版本。
   */
  type SkuResult = {
    skuId: Id;
    stockQuantity: Decimal;
    skuVersion: number;
    productVersion: number;
  };
}
