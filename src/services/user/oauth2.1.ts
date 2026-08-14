import { doPostFrom } from '@/services/httpClient';

/**
 * Oauth2.1 登录客户端
 * @param data data
 * @param options options
 */
export async function oauth2Login(
  data: Oauth.ClientLoginParam,
  options?: { [key: string]: any },
): Promise<Oauth.ClientToken> {
  return doPostFrom('/oauth_server/login', data, options);
}

/**
 * Oauth2.1 请求授权
 * @param data data
 * @param options options
 */
export async function oauth2AuthorizeCodeOrConsent(
  data: Oauth.AuthorizeParam,
  options?: { [key: string]: any },
): Promise<Oauth.AuthorizeCode | Oauth.Consent> {
  return doPostFrom('/oauth_server/oauth2/authorize', data, options);
}

/**
 * Oauth2.1 获取授权Token
 * @param data data
 * @param options options
 */
export async function oauth2Token(
  data: Oauth.AuthorizeTokenParam,
  options?: { [kye: string]: any },
): Promise<Oauth.AuthorizeToken> {
  return doPostFrom('/oauth_server/oauth2/token', data, options);
}

/**
 * Oauth2.1 Oidc 退出登录
 * @param data data
 * @param options options
 */
export async function logout(data: Oauth.OidcLogout, options?: { [key: string]: any }) {
  return doPostFrom('/oauth_server/connect/logout', data, options);
}
