declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module '*.md' {
  const content: string;
  export default content;
}
declare module 'mockjs';

declare const __APP_VERSION__: string;
declare const __UMI_VERSION__: string;
declare const __UTOO_VERSION__: string;

declare const BASE_URL: 'http' | 'https' | '';
declare const CLIENT_BASIC_TOKEN: '';
declare const LOCAL_TOKEN: string;
declare const LOCAL_OSS_STORAGE_ID: string;
declare const CONTEXT_PATH: '';
declare const CLIENT_ID: '';
