declare namespace Common {
  /**
   * 分页响应中用于渲染列表的记录和总条数。
   */
  type Page<T> = {
    records: T[];
    total: number;
  };

  /**
   * 分页状态及查询参数。
   */
  type Pagination = {
    current?: number;
    pageSize?: number;
    total?: number;
  };

  type BreadcrumbItem = ItemType & {
    linkPath?: string
  };

  interface JsonResult {
    success: boolean;
    data: any;
    message: string;
    code?: number;
    showType?: number;
  }
}
