import { createStyles } from 'antd-style';

export const loginFontFamily =
  '-apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", "PingFang SC", sans-serif';

export const useStyles = createStyles(({ token, css, isDarkMode }) => {
  const border = isDarkMode ? token.colorBorderSecondary : '#dfe7f5';
  const secondary = isDarkMode ? token.colorTextDescription : '#667c9a';
  return {
    page: css`
      color: ${isDarkMode ? token.colorText : '#223754'};
      font-family: ${loginFontFamily};
      background: ${isDarkMode ? token.colorBgLayout : 'radial-gradient(ellipse at 50% 0%, #f9fcff, #edf3fd 75%)'};
    `,
    utilities: css`
      min-height: 88px;
      flex-shrink: 0;
      @media (max-width: 899px) { min-height: 80px; }
      @media (max-width: 479px) { min-height: 70px; }
    `,
    lang: css`
      width: 42px;
      height: 42px;
      line-height: 42px;
      position: fixed;
      top: 0;
      right: 16px;
      z-index: 10;
      border-radius: ${token.borderRadius}px;
      &:hover { background-color: ${token.colorBgTextHover}; }
    `,
    main: css`
      min-width: 0;
      padding: 0 40px 28px;
      @media (max-width: 1100px) { padding-inline: 28px; }
      @media (max-width: 899px) { padding: 16px 24px 24px; }
      @media (max-width: 479px) { padding-inline: 16px; }
    `,
    shell: css`
      width: 100%;
      max-width: 1440px;
      display: grid;
      grid-template-columns: 48% 52%;
      border: 1px solid ${border};
      border-radius: 20px;
      background: ${isDarkMode ? token.colorBgLayout : '#f8faff'};
      box-shadow: 0 14px 50px #24487c0b;
      @media (max-width: 1100px) { grid-template-columns: 44% 56%; }
      @media (max-width: 899px) {
        display: block;
        border: 0;
        background: transparent;
        box-shadow: none;
      }
    `,
    hero: css`
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      padding: 76px 48px;
      border-right: 1px solid ${border};
      border-radius: 20px 0 0 20px;
      background: ${isDarkMode ? token.colorBgContainer : 'radial-gradient(ellipse at 0% 100%, #e3efff, #edf5ff 65%)'};
      @media (min-width: 1680px) { padding-inline: 72px; }
      @media (max-width: 1100px) { padding: 56px 36px; }
      @media (max-width: 899px) { display: none; }
    `,
    heroContent: css`width: 100%; max-width: 430px;`,
    eyebrow: css`
      margin: 0 0 26px;
      color: ${isDarkMode ? secondary : '#5376a8'};
      font-size: 12px;
      line-height: 1.6;
      letter-spacing: 2.4px;
    `,
    rule: css`
      width: 32px;
      height: 3px;
      margin-bottom: 25px;
      border-radius: 2px;
      background: ${isDarkMode ? token.colorPrimary : '#2563eb'};
    `,
    heroTitle: css`
      margin: 0;
      font-size: 40px;
      line-height: 1.5;
      font-weight: 500;
      letter-spacing: 1px;
      overflow-wrap: anywhere;
      @media (max-width: 1100px) { font-size: 34px; }
    `,
    description: css`
      margin: 24px 0 0;
      color: ${secondary};
      font-size: 15px;
      line-height: 1.9;
    `,
    caption: css`
      margin: 52px 0 0;
      padding-top: 18px;
      border-top: 1px solid ${isDarkMode ? border : '#cfdff4'};
      color: ${secondary};
      font-size: 12px;
      line-height: 1.6;
      letter-spacing: 0.4px;
    `,
    loginRegion: css`
      min-width: 0;
      padding: 56px 40px;
      @media (min-width: 1680px) { padding-block: 70px; }
      @media (max-width: 1100px) { padding: 44px 28px; }
      @media (max-width: 899px) { padding: 0; }
    `,
    card: css`
      box-sizing: border-box;
      width: 100%;
      max-width: 448px;
      padding: 36px;
      border: 1px solid ${border};
      border-radius: 16px;
      background: ${token.colorBgContainer};
      box-shadow: 0 8px 28px #24487c07;
      @media (max-width: 1100px) { padding: 30px; }
      @media (max-width: 479px) { padding: 28px 22px; border-radius: 14px; }
    `,
    title: css`
      margin: 0;
      font-size: 27px;
      line-height: 1.4;
      font-weight: 500;
      @media (max-width: 479px) { font-size: 25px; }
    `,
    intro: css`margin: 10px 0 0; color: ${secondary}; font-size: 13px; line-height: 1.6;`,
    form: css`
      margin-top: 30px;
      .ant-form-item { margin-bottom: 20px; }
      .ant-form-item-label { padding-bottom: 8px; }
      .ant-form-item-label > label { height: auto; font-size: 13px; line-height: 1.6; }
      .ant-input-prefix { color: ${token.colorTextQuaternary}; margin-inline-end: 10px; }
      .ant-input-affix-wrapper { height: 48px; }
      .ant-input-password-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 44px;
        min-height: 44px;
        margin-inline-end: -10px;
      }
      .ant-input-password-icon:focus-visible { outline: 2px solid ${token.colorPrimary}; border-radius: 4px; }
      @media (max-width: 479px) { input.ant-input { font-size: 16px; } }
    `,
    error: css`margin-bottom: 20px; overflow-wrap: anywhere;`,
    formOptions: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 4px 12px;
      .ant-checkbox-wrapper, .ant-btn { font-size: 13px; }
      .ant-btn { height: 28px; padding: 0; }
      @media (pointer: coarse) {
        .ant-checkbox-wrapper, .ant-btn { min-height: 44px; display: inline-flex; align-items: center; }
      }
    `,
    submit: css`margin-top: 22px; font-weight: 500;`,
    divider: css`
      &.ant-divider { margin: 28px 0 15px; color: ${secondary}; font-size: 12px; }
    `,
    providers: css`
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
      .ant-btn { padding-inline: 12px; font-size: 12px; }
      @media (pointer: coarse) { .ant-btn { min-height: 44px; } }
    `,
  };
});
