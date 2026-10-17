import { accessSync, constants, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDevProcesses } from './dev-processes.mjs';

const directory = fileURLToPath(new URL('../', import.meta.url));
const environmentFile = resolve(directory, '.env.local');
if (existsSync(environmentFile)) process.loadEnvFile(environmentFile);
const localHTTPS = process.argv.includes('--https');
const cert = resolve(
  directory,
  process.env.VAULT_DEV_CERT || '.certs/localhost.pem',
);
const key = resolve(
  directory,
  process.env.VAULT_DEV_KEY || '.certs/localhost-key.pem',
);

try {
  if (localHTTPS) {
    accessSync(cert, constants.R_OK);
    accessSync(key, constants.R_OK);
  }
} catch {
  console.error(`缺少前端 HTTPS 证书。
已有 nginx HTTPS 时，请使用 npm run dev 启动 HTTP 开发服务，并访问 VAULT_DEV_ORIGIN 配置的站点。
通过 npm run nginx:dev 从本地环境变量生成 NGINX 配置，详见 README.md。

如需前端独立提供 HTTPS，可用 VAULT_DEV_CERT / VAULT_DEV_KEY 指定证书，详见 README.md。`);
  process.exit(1);
}

runDevProcesses([
  {
    name: '密码库',
    entry: resolve(directory, 'node_modules/@umijs/max/bin/max.js'),
    args: ['dev'],
    cwd: directory,
    env: {
      // ERP's Utoopack dev server reserves 8000 and 8001.
      PORT: '8002',
      STRICT_PORT: '8002',
      HOST: process.env.HOST || '127.0.0.1',
      VAULT_DEV_HTTPS: localHTTPS ? '1' : '0',
      VAULT_DEV_CERT: cert,
      VAULT_DEV_KEY: key,
    },
  },
]);
