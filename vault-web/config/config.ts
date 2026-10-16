import type { ClientRequest, IncomingMessage } from 'node:http';
import { resolve } from 'node:path';
import { defineConfig } from '@umijs/max';

const localHTTPS = process.env.VAULT_DEV_HTTPS === '1';
const apiTarget = process.env.VAULT_API_TARGET;

function preserveBrowserOrigin(
  proxyRequest: ClientRequest,
  request: IncomingMessage,
) {
  // Umi also rewrites Origin when changeOrigin is enabled. Restore the actual browser header.
  if (request.headers.origin !== undefined)
    proxyRequest.setHeader('Origin', request.headers.origin);
  else proxyRequest.removeHeader('Origin');
}

export default defineConfig({
  title: 'Personal vault',
  npmClient: 'npm',
  hash: true,
  mfsu: false,
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  https: localHTTPS
    ? {
        key: resolve(
          __dirname,
          '..',
          process.env.VAULT_DEV_KEY || '.certs/localhost-key.pem',
        ),
        cert: resolve(
          __dirname,
          '..',
          process.env.VAULT_DEV_CERT || '.certs/localhost.pem',
        ),
        hosts: ['localhost', '127.0.0.1'],
        http2: false,
      }
    : undefined,
  routes: [{ path: '/', component: './vault' }],
  locale: { default: 'zh-CN', antd: true, baseNavigator: false },
  antd: {
    appConfig: {},
    configProvider: {
      button: { autoInsertSpace: false },
      theme: { token: { colorPrimary: '#167566', borderRadius: 10 } },
    },
  },
  request: {},
  tailwindcss: {},
  proxy: apiTarget
    ? {
        '/vault-auth': {
          target: apiTarget,
          // Select the upstream nginx virtual host; retain the browser's Origin header.
          changeOrigin: true,
          onProxyReq: preserveBrowserOrigin,
        },
        '/api/v1/vault': {
          target: apiTarget,
          changeOrigin: true,
          onProxyReq: preserveBrowserOrigin,
        },
      }
    : undefined,
});
