declare namespace System {
  type Attachment = {
    id: number | string;
    originalName: string;
    contentType: string;
    fileSize: number;
    objectKey: string;
    previewUrl: string;
  };

  type Menu = {
    id?: string;
    parentId?: string;
    hierarchy?: string;
    clientId?: string;
    type?: number;
    name?: string;
    parentMenuName?: string;
    i18nCode?: string;
    path?: string;
    component?: string;
    icon?: string;
    permissionCode?: string;
    sort?: number;
  };

  type MenuVO = Menu & {
    children?: MenuVO[];
    hasChildren?: boolean;
    selected?: boolean;
  };

  type MenuPage = Common.BasePage & {
    records: MenuVO[];
  };

  type SystemLocale = {
    id: number;
    code: string;
    name: string;
    nativeName: string;
    defaultLocal: boolean;
  };
}
