import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDevProcesses } from '../vault-web/scripts/dev-processes.mjs';

const directory = fileURLToPath(new URL('../', import.meta.url));
const applications = [
  {
    name: 'ERP',
    entry: 'node_modules/@umijs/max/bin/max.js',
    args: ['dev'],
    env: { UMI_ENV: 'dev', MOCK: 'none', PORT: '8000', STRICT_PORT: '8000' },
  },
  {
    name: '密码库',
    entry: 'vault-web/scripts/dev.mjs',
    args: [],
    env: {},
  },
];

console.log('正在启动 ERP（8000）和密码库（8002）；按 Ctrl+C 同时停止。');
runDevProcesses(
  applications.map((application) => ({
    ...application,
    cwd: directory,
    entry: resolve(directory, application.entry),
  })),
);
