import { defineConfig } from '@umijs/max';

export default defineConfig({
  title: '筑绿新材',

  define: {
    // BASE_URL: 'https://home.muzhi.store:20000/muzhi_cloud',
    BASE_URL: 'https://local.muzhi.store/api',
    CLIENT_ID: 'muzhi-cloud',
    CLIENT_BASIC_TOKEN: 'Basic bXV6aGktY2xvdWQ6bXV6aGktcGFzc3dvcmQ=',
    CONTEXT_PATH: '',
  },
});
