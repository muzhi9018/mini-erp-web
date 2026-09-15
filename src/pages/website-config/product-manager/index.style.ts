import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css, token }) => ({
  editorNotice: css`
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
    margin-bottom: 20px;
    padding: 16px 18px;
    border: 1px solid ${token.colorPrimaryBorder};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorPrimaryBg};
  `,
  noticeIcon: css`
    display: inline-flex;
    width: 36px;
    height: 36px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: ${token.colorPrimary};
    color: ${token.colorTextLightSolid};
    font-size: ${token.fontSizeLG}px;
  `,
  noticeContent: css`
    min-width: 0;
    padding-top: 1px;
  `,
  noticeTitle: css`
    margin: 0;
    color: ${token.colorTextHeading};
    font-size: ${token.fontSize}px;
    font-weight: 600;
    line-height: ${token.lineHeight};
  `,
  noticeDescription: css`
    margin: 4px 0 0;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    line-height: ${token.lineHeightLG};
  `,
  editorLayout: css`
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    gap: 20px;
    align-items: start;

    @media (max-width: 991px) {
      grid-template-columns: 1fr;
    }
  `,
  stepsCard: css`
    position: sticky;
    top: 72px;
    padding: 14px 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
    box-shadow: ${token.boxShadowTertiary};

    .ant-steps-item {
      padding-bottom: 12px;
    }

    .ant-steps-item:last-child {
      padding-bottom: 0;
    }

    .ant-steps-item-title {
      font-weight: 600;
    }

    @media (max-width: 991px) {
      position: static;
    }
  `,
  collapse: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    border: 0;
    background: transparent;

    > .ant-collapse-item {
      overflow: hidden;
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: ${token.borderRadiusLG}px !important;
      background: ${token.colorBgContainer};
      box-shadow: ${token.boxShadowTertiary};
    }

    > .ant-collapse-item > .ant-collapse-header {
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(90deg, ${token.colorPrimaryBg}, ${token.colorBgContainer});
    }

    > .ant-collapse-item > .ant-collapse-content {
      border-top-color: ${token.colorBorderSecondary};
    }

    > .ant-collapse-item > .ant-collapse-content > .ant-collapse-content-box {
      padding: 20px 16px 8px;
    }
  `,
  panelLabel: css`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-width: 0;
    scroll-margin-top: 72px;
  `,
  panelTitle: css`
    display: flex;
    align-items: center;
    gap: 10px;
    color: ${token.colorTextHeading};
    font-size: ${token.fontSizeLG}px;
    font-weight: 650;
  `,
  panelNumber: css`
    display: inline-flex;
    width: 28px;
    height: 28px;
    align-items: center;
    justify-content: center;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorPrimary};
    color: ${token.colorWhite};
    font-size: ${token.fontSizeSM}px;
    box-shadow: 0 4px 10px ${token.colorPrimaryBorder};
  `,
  panelDescription: css`
    overflow: hidden;
    max-width: 48%;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    font-weight: 400;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (max-width: 767px) {
      display: none;
    }
  `,
  itemGrid: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  `,
  itemCard: css`
    border-color: ${token.colorBorderSecondary};
    background: ${token.colorFillAlter};

    .ant-card-head {
      min-height: 42px;
      padding-inline: 12px;
      background: ${token.colorBgContainer};
    }

    .ant-card-head-title {
      padding-block: 9px;
      font-size: ${token.fontSizeSM}px;
    }

    .ant-card-body {
      padding: 12px;
    }
  `,
  cardTitle: css`
    display: flex;
    align-items: center;
    gap: 7px;
  `,
  cardIcon: css`
    display: inline-flex;
    width: 18px;
    height: 18px;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background: ${token.colorPrimary};
    color: ${token.colorWhite};
    font-size: 10px;
  `,
  cardActions: css`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .ant-btn {
      padding-inline: 8px;
    }
  `,
  imageUpload: css`
    .ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-list-item-container,
    .ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-select {
      width: 132px;
      height: 96px;
    }
  `,
  uploadButton: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    border: 0;
    background: transparent;
    color: ${token.colorTextSecondary};
    cursor: pointer;
  `,
  mediaLayout: css`
    display: grid;
    grid-template-columns: 132px minmax(0, 1fr);
    gap: 12px;
    align-items: start;

    .ant-form-item
      .ant-upload-wrapper.ant-upload-picture-card-wrapper
      .ant-upload-list-item-container,
    .ant-form-item
      .ant-upload-wrapper.ant-upload-picture-card-wrapper
      .ant-upload-select {
      height: 140px;
    }

    @media (max-width: 575px) {
      grid-template-columns: 1fr;
    }
  `,
  uploadHint: css`
    margin-top: -12px;
    margin-bottom: 16px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
}));
