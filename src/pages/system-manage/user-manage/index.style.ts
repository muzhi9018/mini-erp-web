import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css, token }) => ({
  resetHeader: css`
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding-right: 20px;
  `,
  resetSuccessIcon: css`
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: ${token.colorSuccessBg};
    color: ${token.colorSuccess};
    font-size: 24px;
  `,
  resetTitle: css`
    margin: 0 0 4px;
    color: ${token.colorTextHeading};
    font-size: ${token.fontSizeLG + 2}px;
    font-weight: 600;
    line-height: 1.4;
  `,
  resetSubtitle: css`
    margin: 0;
    color: ${token.colorTextSecondary};
    font-weight: 400;
    line-height: ${token.lineHeightLG};
  `,
  passwordPanel: css`
    padding: 18px 20px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorFillAlter};
  `,
  passwordLabel: css`
    display: block;
    margin-bottom: 8px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    font-weight: 400;
  `,
  passwordValue: css`
    margin-bottom: 0 !important;
    color: ${token.colorTextHeading};
    font-family: ${token.fontFamilyCode};
    font-size: 28px;
    font-weight: 600;
    letter-spacing: 0.1em;
    line-height: 1.3;

    .ant-typography-copy {
      margin-left: 12px;
      font-size: ${token.fontSizeLG}px;
      letter-spacing: normal;
    }
  `,
  resetNotice: css`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 16px 0 24px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    line-height: ${token.lineHeightLG};

    svg {
      flex: none;
      margin-top: 2px;
      color: ${token.colorTextTertiary};
    }
  `,
}));
