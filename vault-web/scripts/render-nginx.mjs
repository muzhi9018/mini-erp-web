import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../', import.meta.url));
const environmentFile = resolve(directory, '.env.local');
if (existsSync(environmentFile)) process.loadEnvFile(environmentFile);

function required(name) {
  const value = process.env[name]?.trim();
  if (!value || /[\r\n]/.test(value))
    throw new Error(`请在 .env.local 或运行环境中配置有效的 ${name}。`);
  return value;
}

function origin(name, protocols) {
  let url;
  try {
    url = new URL(required(name));
  } catch {
    throw new Error(`${name} 必须为有效的 Origin。`);
  }
  if (
    !protocols.includes(url.protocol) ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new Error(`${name} 必须为不含路径、查询参数或凭据的 Origin。`);
  return url;
}

const site = origin('VAULT_DEV_ORIGIN', ['https:']);
if (site.port)
  throw new Error(
    'NGINX 开发模板监听 443，VAULT_DEV_ORIGIN 不得指定其他端口。',
  );

const variables = {
  VAULT_DEV_HOST: site.hostname,
  VAULT_NGINX_API_TARGET: origin('VAULT_NGINX_API_TARGET', ['http:', 'https:'])
    .origin,
  VAULT_NGINX_CERT: resolve(directory, required('VAULT_NGINX_CERT')),
  VAULT_NGINX_KEY: resolve(directory, required('VAULT_NGINX_KEY')),
};
const template = readFileSync(
  resolve(directory, 'deploy/nginx.dev.conf'),
  'utf8',
);
const config = template.replace(
  /\$\{(VAULT_DEV_HOST|VAULT_NGINX_API_TARGET|VAULT_NGINX_CERT|VAULT_NGINX_KEY)\}/g,
  (_, name) => variables[name].replace(/\\/g, '\\\\').replace(/"/g, '\\"'),
);
writeFileSync(resolve(directory, 'deploy/nginx.dev.local.conf'), config, {
  mode: 0o600,
});
console.log('已生成 deploy/nginx.dev.local.conf；该文件已被 Git 忽略。');
