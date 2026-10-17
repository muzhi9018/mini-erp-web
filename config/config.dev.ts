import { defineConfig } from '@umijs/max';

export default defineConfig({
  title: '筑绿新材',

  define: {
    CLIENT_ID: process.env.DEV_CLIENT_ID ?? '',
    CLIENT_BASIC_TOKEN: process.env.DEV_CLIENT_BASIC_TOKEN ?? '',
    CONTEXT_PATH: '',
  },
});
