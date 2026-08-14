declare namespace System {
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
}
