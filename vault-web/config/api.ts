export function readApiBaseURL(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== 'production') return '';

  if (env.VAULT_API_BASE_URL === undefined)
    throw new Error('请配置 VAULT_API_BASE_URL；使用同源代理时请显式留空。');

  const value = env.VAULT_API_BASE_URL.trim();
  if (!value) return '';

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('VAULT_API_BASE_URL 必须为有效的 HTTPS 接口地址。');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    /[\r\n\\]/.test(value)
  )
    throw new Error(
      'VAULT_API_BASE_URL 必须使用 HTTPS，且不能包含凭据、查询参数或片段。',
    );

  return url.origin + url.pathname.replace(/\/+$/, '');
}
