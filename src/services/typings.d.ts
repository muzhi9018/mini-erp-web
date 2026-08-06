declare namespace Common {
  type BasePage = {
    total: number;
  };

  type Page = {
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
