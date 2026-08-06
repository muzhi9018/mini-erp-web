import { history } from '@umijs/max';
import { stringify } from 'querystring';

/**
 * 退出登录处理器
 */
export function logoutHandler() {
  localStorage.clear();
  const { search, pathname } = window.location;
  const urlParams = new URL(window.location.href).searchParams;
  /** 此方法会跳转到 redirect 参数所在的位置 */
  const redirect = urlParams.get('redirect');
  // Note: There may be security issues, please note
  if (window.location.pathname !== '/user/login' && !redirect) {
    history.replace({
      pathname: '/user/login',
      search: stringify({
        redirect: pathname.replaceAll(CONTEXT_PATH ?? '', '') + search,
      }),
    });
  }
}
