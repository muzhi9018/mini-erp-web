import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css, token }) => ({
  editorPage: css`
    .ant-pro-page-container-children-container {
      padding-bottom: 40px;
    }
  `,
  editorFooter: css`
    border-top: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
    box-shadow: 0 -4px 20px ${token.colorFillQuaternary};
    .ant-btn {
      min-width: 112px;
      border-radius: 8px;
    }
  `,
  editorForm: css`
    width: 100%;
    .ant-form-item {
      margin-bottom: 22px;
    }
    .ant-form-item-label > label {
      color: ${token.colorText};
      font-weight: 500;
    }
    .ant-form-item-extra {
      padding-top: 6px;
      color: ${token.colorTextTertiary};
      font-size: 12px;
      line-height: 1.7;
    }
    .ant-input:not(textarea), .ant-select-single, .ant-input-number {
      min-height: 40px;
    }
    .ant-input-number-input {
      height: 38px;
    }
    .ant-input-textarea-show-count {
      margin-bottom: 6px;
    }
  `,
  editorNotice: css`
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
    margin-bottom: 24px;
    padding: 24px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    background: ${token.colorBgContainer};

    @media (max-width: 575px) {
      grid-template-columns: 40px minmax(0, 1fr);
      gap: 12px;
      padding: 18px;
    }
  `,
  noticeIcon: css`
    display: inline-flex;
    width: 48px;
    height: 48px;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: ${token.colorPrimaryBg};
    color: ${token.colorPrimary};
    font-size: 23px;

    @media (max-width: 575px) {
      width: 40px;
      height: 40px;
      font-size: 20px;
    }
  `,
  noticeContent: css`
    min-width: 0;
  `,
  noticeTitle: css`
    margin: 0;
    color: ${token.colorTextHeading};
    font-size: 18px;
    font-weight: 600;
    line-height: 1.5;
  `,
  noticeDescription: css`
    max-width: 760px;
    margin: 6px 0 0;
    color: ${token.colorTextSecondary};
    font-size: 13px;
    line-height: 1.8;
  `,
  languageBadge: css`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;
    background: ${token.colorFillAlter};
    color: ${token.colorTextSecondary};
    font-size: 12px;
    white-space: nowrap;

    @media (max-width: 575px) {
      grid-column: 2;
      justify-self: start;
    }
  `,
  editorLayout: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 20px;
  `,
  sectionNavigation: css`
    position: sticky;
    top: 64px;
    z-index: 10;
    display: flex;
    gap: 4px;
    overflow-x: auto;
    padding: 6px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 10px;
    background: ${token.colorBgContainer};
    box-shadow: ${token.boxShadowTertiary};
  `,
  navigationItem: css`
    display: flex;
    flex: 1 0 auto;
    align-items: center;
    justify-content: center;
    gap: 9px;
    min-height: 42px;
    padding: 10px 14px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: ${token.colorTextSecondary};
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    transition: color 0.2s, background 0.2s;
    white-space: nowrap;

    > span {
      color: ${token.colorTextTertiary};
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }
    &:hover {
      background: ${token.colorFillAlter};
      color: ${token.colorPrimary};
    }
    &[aria-current='step'] {
      background: ${token.colorPrimaryBg};
      color: ${token.colorPrimary};
      font-weight: 600;
    }
    &[aria-current='step'] > span {
      color: ${token.colorPrimary};
    }
    &:focus-visible {
      outline: 2px solid ${token.colorPrimary};
      outline-offset: -2px;
    }
  `,
  collapse: css`
    display: flex;
    flex-direction: column;
    gap: 20px;
    border: 0;
    background: transparent;

    > .ant-collapse-item {
      overflow: hidden;
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: 12px !important;
      background: ${token.colorBgContainer};
    }
    > .ant-collapse-item > .ant-collapse-header {
      align-items: center;
      padding: 22px 24px;
      background: ${token.colorBgContainer};
    }
    > .ant-collapse-item > .ant-collapse-content {
      border-top-color: ${token.colorBorderSecondary};
    }
    > .ant-collapse-item > .ant-collapse-content > .ant-collapse-content-box {
      padding: 26px 24px 8px;
    }
    @media (max-width: 575px) {
      > .ant-collapse-item > .ant-collapse-header {
        padding: 18px 16px;
      }
      > .ant-collapse-item > .ant-collapse-content > .ant-collapse-content-box {
        padding: 20px 16px 8px;
      }
    }
  `,
  panelLabel: css`
    display: flex;
    flex: 1;
    align-items: center;
    gap: 14px;
    min-width: 0;
    scroll-margin-top: 138px;
  `,
  panelIcon: css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: ${token.colorPrimaryBg};
    color: ${token.colorPrimary};
    font-size: 18px;
  `,
  panelHeading: css`
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 4px;
  `,
  panelTitle: css`
    color: ${token.colorTextHeading};
    font-size: 16px;
    font-weight: 600;
  `,
  panelNumber: css`
    margin-right: 16px;
    color: ${token.colorTextQuaternary};
    font-size: 25px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  `,
  panelDescription: css`
    color: ${token.colorTextTertiary};
    font-size: 12px;
    font-weight: 400;
    line-height: 1.6;
  `,
  itemGrid: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  `,
  itemCard: css`
    min-width: 0;
    border-color: ${token.colorBorderSecondary};
    border-radius: 10px;
    background: ${token.colorBgContainer};
    .ant-card-head {
      min-height: 52px;
      padding-inline: 16px;
      border-bottom: 1px solid ${token.colorBorderSecondary};
      background: ${token.colorFillAlter};
    }
    .ant-card-head-title {
      padding-block: 12px;
      font-size: 13px;
      font-weight: 500;
    }
    .ant-card-body {
      padding: 18px 16px 0;
    }
  `,
  cardTitle: css`
    display: flex;
    align-items: center;
    gap: 9px;
  `,
  itemNumber: css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 6px;
    background: ${token.colorBgContainer};
    color: ${token.colorTextSecondary};
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  `,
  cardActions: css`
    display: flex;
    gap: 4px;
    .ant-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      border-color: transparent;
      background: transparent;
      box-shadow: none;
    }
    .ant-btn:not(:disabled):hover {
      background: ${token.colorBgContainer};
      border-color: ${token.colorBorderSecondary};
    }
  `,
  addButton: css`
    grid-column: 1 / -1;
    height: 44px;
    border-radius: 8px;
    background: ${token.colorFillAlter};
    color: ${token.colorTextSecondary};
  `,
  sectionHint: css`
    margin: 0 0 18px;
    color: ${token.colorTextTertiary};
    font-size: 12px;
    line-height: 1.8;
  `,
  imageUpload: css`
    .ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-list.ant-upload-list-picture-card .ant-upload-list-item-container,
    .ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-select {
      width: 144px;
      height: 116px;
      border-radius: 10px;
    }
    .ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-select {
      background: ${token.colorFillAlter};
    }
    .ant-upload-list-item-thumbnail img {
      object-fit: cover;
    }
  `,
  uploadButton: css`
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 0;
    background: transparent;
    color: ${token.colorTextTertiary};
    font-size: 12px;
    cursor: pointer;
    .anticon {
      color: ${token.colorPrimary};
      font-size: 24px;
    }
    &:disabled {
      cursor: not-allowed;
    }
  `,
  mediaLayout: css`
    display: grid;
    grid-template-columns: 144px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
    @media (max-width: 575px) {
      grid-template-columns: 1fr;
    }
  `,
  marketingLayout: css`
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 0 28px;
    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  `,
  coverSection: css`
    padding: 18px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 10px;
    background: ${token.colorFillAlter};
    align-self: start;
    .ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-list.ant-upload-list-picture-card .ant-upload-list-item-container,
    .ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload-select {
      width: 100%;
      height: 168px;
      margin: 0;
      background: ${token.colorBgContainer};
    }
    .ant-upload-list {
      display: block;
    }
  `,
  imageSections: css`
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    margin-block: 8px 20px;
  `,
  imageSection: css`
    min-width: 0;
    border-color: ${token.colorBorderSecondary};
    border-radius: 10px;
    background: ${token.colorFillAlter};
    .ant-card-head {
      min-height: 50px;
      padding-inline: 18px;
      border: 0;
    }
    .ant-card-head-title {
      font-size: 14px;
    }
    .ant-card-body {
      padding: 0 18px 18px;
    }
  `,
  productPresentation: css`
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    align-items: start;
    gap: 24px;
    @media (max-width: 1199px) {
      grid-template-columns: minmax(0, 1fr);
      gap: 20px;
    }
  `,
  featureSection: css`
    min-width: 0;
    border-color: ${token.colorBorderSecondary};
    border-radius: 10px;
    background: ${token.colorFillAlter};
    > .ant-card-head {
      min-height: 50px;
      padding-inline: 18px;
      border: 0;
      font-size: 14px;
    }
    > .ant-card-body {
      padding: 0 18px 18px;
    }
    .ant-form-item {
      margin-bottom: 14px;
    }
  `,
  featureList: css`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    .ant-card-head {
      min-height: 40px;
      padding-inline: 12px;
    }
    .ant-card-head-title {
      padding-block: 8px;
    }
    .ant-card-body {
      padding: 12px 12px 0;
    }
    .ant-form-item {
      margin-bottom: 10px;
    }
    .ant-form-item-label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      padding: 0;
      clip-path: inset(50%);
    }
  `,
  carouselEditor: css`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    gap: 16px;
  `,
  carouselPreview: css`
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    min-width: 0;
    overflow: hidden;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    background: ${token.colorBgContainer};
  `,
  carouselSlider: css`
    img {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 1;
      object-fit: contain;
    }
    .slick-dots li button {
      background: ${token.colorPrimary};
    }
  `,
  carouselEmpty: css`
    display: flex;
    aspect-ratio: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
    text-align: center;
    color: ${token.colorTextTertiary};
    font-size: 12px;
    > .anticon {
      margin-bottom: 6px;
      color: ${token.colorPrimary};
      font-size: 42px;
    }
    > strong {
      color: ${token.colorTextSecondary};
      font-size: 16px;
      font-weight: 500;
    }
  `,
  carouselPrevious: css`
    position: absolute;
    top: 50%;
    left: 12px;
    z-index: 1;
    transform: translateY(-50%);
    box-shadow: ${token.boxShadowTertiary};
  `,
  carouselNext: css`
    position: absolute;
    top: 50%;
    right: 12px;
    z-index: 1;
    transform: translateY(-50%);
    box-shadow: ${token.boxShadowTertiary};
  `,
  carouselCounter: css`
    position: absolute;
    right: 16px;
    bottom: 12px;
    padding: 4px 9px;
    border-radius: 6px;
    background: ${token.colorFillAlter};
    color: ${token.colorTextSecondary};
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  `,
  carouselThumbnails: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 12px;
    min-width: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    @media (max-width: 575px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
  `,
  carouselThumbnail: css`
    min-width: 0;
    overflow: hidden;
    padding: 8px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 10px;
    background: ${token.colorBgContainer};
    cursor: grab;
    transition: border-color 0.2s, box-shadow 0.2s;
    &[data-active='true'] {
      border-color: ${token.colorPrimary};
    }
    &[data-drop-target='true'] {
      border-color: ${token.colorPrimary};
      box-shadow: 0 0 0 2px ${token.colorPrimaryBg};
    }
    &:active {
      cursor: grabbing;
    }
  `,
  carouselThumbnailImage: css`
    display: flex;
    width: 100%;
    aspect-ratio: 4 / 3;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: ${token.colorFillAlter};
    color: ${token.colorTextTertiary};
    cursor: pointer;
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      user-select: none;
    }
    &:focus-visible {
      outline: 2px solid ${token.colorPrimary};
      outline-offset: -2px;
    }
  `,
  carouselThumbnailToolbar: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    margin-top: 8px;
    .ant-btn {
      width: 24px;
      height: 24px;
    }
  `,
  carouselDragHandle: css`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: ${token.colorTextTertiary};
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  `,
  carouselUpload: css`
    .ant-upload {
      display: block;
      width: 100%;
    }
  `,
  carouselAddButton: css`
    display: flex;
    width: 100%;
    min-height: 148px;
    flex-direction: column;
    gap: 12px;
    border-radius: 10px;
    background: ${token.colorBgContainer};
    color: ${token.colorPrimary};
    .anticon {
      font-size: 24px;
    }
  `,
  carouselErrors: css`
    margin-top: 12px;
    color: ${token.colorError};
    font-size: 12px;
  `,
  previewBadge: css`
    padding: 3px 8px;
    border-radius: 6px;
    background: ${token.colorPrimaryBg};
    color: ${token.colorPrimary};
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  `,
  detailPresentation: css`
    align-items: stretch;
    @media (max-width: 1199px) {
      grid-auto-rows: 1fr;
    }
  `,
  detailPreviewPanel: css`
    display: flex;
    flex-direction: column;
    min-height: 0;
  `,
  detailManagementPanel: css`
    container-type: inline-size;
  `,
  detailPanel: css`
    min-width: 0;
    padding: 16px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 10px;
    background: ${token.colorBgContainer};
    @media (max-width: 575px) {
      padding: 12px;
    }
  `,
  detailPanelHeader: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
    h3 {
      margin: 0;
      color: ${token.colorTextHeading};
      font-size: 14px;
      font-weight: 600;
    }
    > span {
      color: ${token.colorTextTertiary};
      font-size: 12px;
    }
    .ant-btn {
      border-color: ${token.colorPrimaryBorder};
      color: ${token.colorPrimary};
    }
  `,
  detailManagementTitle: css`
    display: flex;
    align-items: center;
    gap: 10px;
    > span {
      color: ${token.colorTextTertiary};
      font-size: 12px;
    }
  `,
  detailViewer: css`
    height: 0;
    min-height: 0;
    flex: 1;
    contain: size;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;
    background: ${token.colorBgContainer};
    &:focus-visible {
      outline: 2px solid ${token.colorPrimary};
      outline-offset: 2px;
    }
  `,
  detailPreviewImage: css`
    &[data-active='true'] {
      outline: 2px solid ${token.colorPrimary};
      outline-offset: -2px;
    }
    img {
      display: block;
      width: 100%;
      height: auto;
    }
  `,
  detailEmpty: css`
    display: flex;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 20px;
    text-align: center;
    color: ${token.colorTextTertiary};
    font-size: 12px;
    > .anticon {
      color: ${token.colorPrimary};
      font-size: 36px;
    }
    > strong {
      color: ${token.colorTextSecondary};
      font-size: 16px;
      font-weight: 500;
    }
  `,
  detailThumbnails: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: start;
    gap: 12px;
    /* Reserve the height of two rows of 4:5 cards. */
    min-height: calc((100cqw - 12px) * 1.25 + 12px);
    margin: 0;
    padding: 0;
    list-style: none;
    @media (max-width: 575px) {
      grid-template-columns: minmax(0, 1fr);
      min-height: calc(250cqw + 12px);
    }
  `,
  detailThumbnail: css`
    display: flex;
    flex-direction: column;
    aspect-ratio: 4 / 5;
  `,
  detailThumbnailHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-height: 24px;
    margin-bottom: 8px;
    color: ${token.colorTextTertiary};
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  `,
  detailThumbnailImage: css`
    display: block;
    width: 100%;
    height: 0;
    min-height: 0;
    flex: 1;
    overflow: hidden;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: ${token.colorFillAlter};
    color: ${token.colorTextTertiary};
    cursor: pointer;
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
      user-select: none;
    }
    &:focus-visible {
      outline: 2px solid ${token.colorPrimary};
      outline-offset: -2px;
    }
  `,
  detailThumbnailActions: css`
    display: flex;
    gap: 8px;
    margin-top: 10px;
    .ant-btn {
      flex: 1;
      min-width: 0;
      height: 30px;
      padding: 0;
      box-shadow: none;
    }
  `,
  detailUpload: css`
    aspect-ratio: 4 / 5;
    .ant-upload-wrapper, .ant-upload {
      display: block;
      height: 100%;
      width: 100%;
    }
  `,
  detailAddButton: css`
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border-radius: 10px;
    background: ${token.colorFillAlter};
    color: ${token.colorPrimary};
    .anticon {
      font-size: 24px;
    }
  `,
  detailSyncHint: css`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 16px 0 0;
    padding: 10px 12px;
    border-radius: 8px;
    background: ${token.colorPrimaryBg};
    color: ${token.colorTextSecondary};
    font-size: 12px;
    line-height: 1.7;
    .anticon {
      margin-top: 3px;
      color: ${token.colorPrimary};
      font-size: 15px;
    }
  `,
  uploadHint: css`
    margin-top: -10px;
    margin-bottom: 16px;
    color: ${token.colorTextTertiary};
    font-size: 12px;
    line-height: 1.8;
  `,
}));
