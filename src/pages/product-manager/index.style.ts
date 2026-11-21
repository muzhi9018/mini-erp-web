import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token, css }) => ({
  pageContainer: css`
    &.ant-pro-page-container .ant-pro-page-container-children-container {
      padding: 0;
    }
  `,
  workspace: css`
    container-type: inline-size;
    min-width: 0;
    font: 14px/1.55 -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  `,
  pageHeader: css`
    padding-inline: clamp(14px, 3.2vw, 36px);
    background: ${token.colorBgContainer};
    border-block-end: 1px solid ${token.colorBorderSecondary};
  `,
  detailHeader: css`padding-bottom: 12px;`,
  breadcrumb: css`
    padding-top: 22px;
    font-size: 12px;
    line-height: 26px;
    .ant-btn { height: 26px; padding-inline: 2px; font-size: inherit; }
    .ant-breadcrumb-separator { margin-inline: 8px; }
  `,
  pageWork: css`padding: 22px clamp(14px, 3.2vw, 36px) 28px;`,
  required: css`
    &::after {
      content: '*';
      margin-inline-start: 4px;
      color: ${token.colorError};
    }
  `,
  form: css`
    .ant-form-item-label > label { font-weight: 590; }
    .ant-form-item-extra { min-height: 0; margin-top: 5px; font-size: 12px; }
    .ant-input-number { width: 100%; }
    .ant-input, .ant-input-number, .ant-select { min-width: 0; }
  `,
  steps: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    padding: 13px 0 4px;
    list-style: none;
  `,
  step: css`
    display: flex;
    align-items: center;
    gap: 7px;
    margin-inline-end: 12px;
    color: ${token.colorTextSecondary};
    > span:first-child {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid ${token.colorBorderSecondary};
      background: ${token.colorFillAlter};
      font-size: 12px;
      font-weight: 650;
    }
    &[aria-current='step'] { color: ${token.colorPrimaryText}; font-weight: 650; }
    &[aria-current='step'] > span:first-child {
      color: ${token.colorTextLightSolid};
      background: ${token.colorPrimary};
      border-color: transparent;
    }
    &[data-complete='true'] > span:first-child {
      color: ${token.colorPrimaryText};
      background: ${token.colorPrimaryBg};
      border-color: transparent;
    }
  `,
  modalContainer: css`
    &.ant-modal-container {
      display: flex;
      flex-direction: column;
      padding: 0;
      max-height: min(90dvh, 760px);
      overflow: hidden;
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: 13px;
    }
  `,
  modalHeader: css`
    &.ant-modal-header {
      margin: 0;
      padding: 13px 52px 13px 17px;
      border-bottom: 1px solid ${token.colorBorderSecondary};
    }
  `,
  modalTitle: css`&.ant-modal-title {font-size: 19px; line-height: 1.35;font-weight: 650;}`,
  modalBody: css`
    &.ant-modal-body { padding: 17px; overflow-y: auto; min-height: 0; }
  `,
  modalFooter: css`
    &.ant-modal-footer {
      margin: 0;
      padding: 13px 17px;
      border-top: 1px solid ${token.colorBorderSecondary};
    }
  `,
  fileInput: css`
    width: 100%;
    min-height: 36px;
    padding: 5px 9px;
    border: 1px dashed ${token.colorBorder};
    border-radius: 8px;
    background: ${token.colorBgContainer};
    &::file-selector-button {
      margin-inline-end: 7px;
      padding: 2px 8px;
      border: 1px solid ${token.colorBorder};
      border-radius: 4px;
      color: ${token.colorText};
      background: ${token.colorFillAlter};
      cursor: pointer;
    }
    &:hover:not(:disabled) { border-color: ${token.colorPrimary}; }
    &:focus-visible { outline: 2px solid ${token.colorPrimary}; outline-offset: 2px; }
  `,
  panel: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    background: ${token.colorBgContainer};
    overflow: hidden;
  `,
  specPanel: css`
    &.ant-collapse > .ant-collapse-item:last-child > .ant-collapse-header {
      align-items: center;
      padding: 14px 17px;
      background: ${token.colorBgContainer};
    }
    &.ant-collapse > .ant-collapse-item:last-child > .ant-collapse-panel {
      border-block-start: 1px solid ${token.colorBorderSecondary};
      background: ${token.colorBgContainer};
    }
  `,
  filters: css`
    padding: 14px 17px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  muted: css`color: ${token.colorTextSecondary};`,
  mono: css`font-family: ${token.fontFamilyCode}; font-size: 12px; color: ${token.colorTextSecondary};`,
  thumbnail: css`
    display: grid;
    width: 42px;
    height: 42px;
    flex: none;
    place-items: center;
    overflow: hidden;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;
    background: ${token.colorFillAlter};
    color: ${token.colorTextTertiary};
    img { object-fit: cover; }
  `,
  skuThumbnail: css`
    width: 32px;
    height: 32px;
    border-radius: 6px;
    img { width: 100%; height: 100%; }
  `,
  catalogTable: css`
    .ant-table-thead > tr > th:nth-child(2),
    .ant-table-tbody > .ant-table-row > td:nth-child(2) { padding-inline-start: 12px; }
    .ant-table-thead > tr > th:last-child,
    .ant-table-tbody > .ant-table-row > td:last-child { padding-inline-end: 16px; }
    .ant-table-row-expand-icon-cell,
    .ant-table-row-expand-icon-cell + td { white-space: normal; }
  `,
  expandedProduct: css`
    &.ant-table-row > .ant-table-cell { background: ${token.colorFillAlter}; }
  `,
  quiet: css`
    &.ant-btn { color: ${token.colorPrimaryText}; padding-inline: 6px; }
    &.ant-btn:not(:disabled):hover { background: ${token.colorPrimaryBg}; }
  `,
  rowAction: css`
    &.ant-btn {
      min-height: 32px;
      padding-inline: 5px;
      white-space: nowrap;
    }
  `,
  galleryPlaceholder: css`
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 6px;
    min-height: 95px;
    border-radius: 8px;
    background: ${token.colorFillAlter};
    color: ${token.colorTextSecondary};
  `,
  expandedSkuRow: css`
    &.ant-table-expanded-row > td {
      padding: 0 !important;
      background: ${token.colorFillAlter};
    }
    &.ant-table-expanded-row > td .ant-table-wrapper:only-child .ant-table {
      /* The expansion column already provides the nested table's indent. */
      margin: 0 !important;
      border-radius: 0;
    }
    .ant-table-thead > tr > th:first-child,
    .ant-table-tbody > tr > td:first-child {
      padding-inline-start: 12px;
    }
  `,
  archiveInfo: css`
    @media (min-width: 768px) {
      padding-inline-start: 24px;
      border-inline-start: 1px solid ${token.colorBorderSecondary};
    }
  `,
  archivePhoto: css`
    overflow: hidden;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorFillAlter};
    img { object-fit: cover; }
  `,
  galleryItem: css`
    position: relative;
    overflow: hidden;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;
    background: ${token.colorBgContainer};
    &[data-cover='true'] { border-color: ${token.colorPrimaryBorder}; }
    &[data-drop='true'] { outline: 2px solid ${token.colorPrimary}; }
    .ant-image { width: 100%; }
    img { display: block; aspect-ratio: 1; object-fit: cover; }
  `,
  pageTitle: css`
    margin: 0;
    font-size: 29px;
    line-height: 1.3;
    letter-spacing: -.025em;
    font-weight: 650;
    overflow-wrap: anywhere;
  `,
  heading: css`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-block: 17px 19px;
  `,
  statusFilter: css`
    &.ant-btn { gap: 7px; padding-inline: 10px; }
    &[aria-pressed='true'], &[aria-expanded='true'] {
      color: ${token.colorPrimaryText};
      background: ${token.colorPrimaryBg};
      font-weight: 600;
    }
  `,
  badge: css`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    border-radius: 5px;
    background: ${token.colorFillAlter};
    color: ${token.colorTextSecondary};
    font-size: 12px;
    white-space: nowrap;
  `,
  status: css`
    &::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    &[data-enabled='true'] {
      background: ${token.colorSuccessBg};
      color: ${token.colorSuccessText};
    }
  `,
  table: css`
    .ant-table-tbody > .ant-table-row > td { vertical-align: middle; }
    .ant-table { font-size: 13px; }
    .ant-table-thead > tr > th {
      font-size: 12px;
      color: ${token.colorTextSecondary};
      white-space: nowrap;
    }
    .ant-table-thead > tr > th::before { display: none; }
  `,
  productName: css`
    color: ${token.colorTextHeading};
    font-weight: 650;
    &:hover { text-decoration: underline; }
  `,
  divider: css`border-color: ${token.colorBorderSecondary};`,
  soft: css`background: ${token.colorFillAlter};`,
  modeOption: css`
    min-width: 0;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;
    padding: 11px;
    margin-inline-end: 0;
    align-items: flex-start;
    &:has(input:checked) {
      border-color: ${token.colorPrimary};
      background: ${token.colorPrimaryBg};
    }
  `,
  priceGroup: css`
    min-width: 0;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;
    padding: 8px 10px;
    legend { padding-inline: 4px; font-weight: 600; }
  `,
  content: css`padding: clamp(13px, 2.3vw, 22px);`,
}));
