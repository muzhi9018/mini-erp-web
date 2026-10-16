import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: { BASE_URL: JSON.stringify('') },
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: {
      '@ant-design/pro-components': join(
        __dirname,
        'node_modules/@ant-design/pro-components/es/index.js',
      ),
      '@': join(__dirname, 'src'),
      '@root': join(__dirname),
      '@@': join(__dirname, 'src', '.umi'),
    },
  },
  test: {
    server: {
      deps: {
        // Transform ProComponents and antd's extensionless ESM locale imports.
        inline: ['@ant-design/pro-components', /antd\/es\//],
      },
    },
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.umi'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/.umi/**',
        'src/services/ant-design-pro/**',
        'src/**/*.d.ts',
        'src/**/index.style.ts',
      ],
    },
    passWithNoTests: true,
    testTimeout: 15000,
  },
});
