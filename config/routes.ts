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
    // 密码库
    path: '/vault',
    name: 'vault',
    icon: 'SafetyCertificateOutlined',
    access: 'vault',
    routes: [
      {
        path: '/vault',
        redirect: '/vault/personal-vault',
      },
      // 个人密码库
      {
        path: '/vault/personal-vault',
        name: 'personal-vault',
        component: './vault/personal-vault',
        access: 'vault:personal-vault',
      },
      // 密码库站点
      {
        path: '/vault/vault-site',
        name: 'vault-site',
        component: './vault/vault-site',
        access: 'vault:vault-site',
      },
    ],
  },
  {
    path: '/product-manager',
    name: 'product-manager',
    icon: 'AppstoreOutlined',
    access: 'product-manager',
    routes: [
      {
        path: '/product-manager',
        component: './product-manager',
        hideInMenu: true,
      },
      {
        path: '/product-manager/product',
        name: 'product',
        component: './product-manager/product',
        access: 'product-manager:product:query',
      },
      {
        path: '/product-manager/product/create',
        name: 'create',
        component: './product-manager/product/create',
        access: 'product-manager:product:create',
        hideInMenu: true,
        parentKeys: ['/product-manager/product'],
      },
      {
        path: '/product-manager/product/:id',
        name: 'detail',
        component: './product-manager/product/detail',
        access: 'product-manager:product:query',
        hideInMenu: true,
        parentKeys: ['/product-manager/product'],
      },
      {
        path: '/product-manager/product-category',
        name: 'product-category',
        component: './product-manager/product-category',
        access: 'product-manager:product-category:query',
      },
      {
        path: '/product-manager/product-unit',
        name: 'product-unit',
        component: './product-manager/product-unit',
        access: 'product-manager:product-unit:query',
      },
    ],
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
        redirect: '/system-manage/user-manage',
      },
      {
        // 用户管理
        path: '/system-manage/user-manage',
        name: 'user-manage',
        component: './system-manage/user-manage',
        access: 'system-manage:user-manage',
      },
      {
        // 角色管理
        path: '/system-manage/role-manage',
        name: 'role-manage',
        component: './system-manage/role-manage',
        access: 'system-manage:role-manage',
      },
      {
        // 菜单管理
        path: '/system-manage/menu-manage',
        name: 'menu-manage',
        component: './system-manage/menu-manage',
        access: 'system-manage:menu-manage',
      },
    ],
  },
  {
    component: './exception/404',
    layout: false,
    path: './*',
  },
];
