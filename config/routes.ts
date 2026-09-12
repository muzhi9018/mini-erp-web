// import { CONTEXT_PATH } from "./constants";

// function icon(path: string) {
//   return CONTEXT_PATH.concat('/icons', path);
// }

export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  {
    path: '/products/:slug',
    component: './website/products/detail',
    layout: false,
  },
  {
    path: '/products',
    component: './website/products',
    layout: false,
  },
  {
    path: '/',
    component: './website/home',
    layout: false,
  },
  {
    path: '/welcome',
    name: 'welcome',
    icon: 'smile',
    component: './Welcome',
  },
  {
    // 官网配置
    path: '/website-config',
    name: 'website-config',
    icon: 'HomeOutlined',
    access: 'website-config',
    routes: [
      {
        path: '/website-config',
        redirect: '/website-config/category-manager',
      },
      {
        // 商品分类管理
        path: '/website-config/category-manager',
        name: 'category-manager',
        component: './website-config/category-manager',
        access: 'website-config:category-manager',
      },
      {
        // 商品管理
        path: '/website-config/product-manager',
        name: 'product-manager',
        component: './website-config/product-manager',
        access: 'website-config:product-manager',
      },
    ],
  },
  {
    // 系统管理
    path: '/system-manage',
    name: 'system-manage',
    // icon: icon('/menu/settings.svg'),
    icon: 'SettingOutlined',
    access: 'system-manage',
    routes: [
      {
        path: '/system-manage',
        redirect: '/system-manage/menu-manage',
      },
      {
        // 菜单管理
        path: '/system-manage/menu-manage',
        name: 'menu-manage',
        component: './system-manage/menu-manage',
        access: 'system-manage:menu-manage',
      },
      {
        // 角色管理
        path: '/system-manage/role-manage',
        name: 'role-manage',
        component: './system-manage/role-manage',
        access: 'system-manage:role-manage',
      },
    ],
  },
  {
    component: './exception/404',
    layout: false,
    path: './*',
  },
];
