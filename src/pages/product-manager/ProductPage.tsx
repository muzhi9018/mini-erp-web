import { AppstoreOutlined, RightOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Breadcrumb, Button, ConfigProvider, type ThemeConfig } from 'antd';
import type { ReactNode } from 'react';
import { useStyles } from './index.style';
import { useProductText } from './shared';

const productTheme: ThemeConfig = {
  token: { controlHeight: 36, borderRadius: 8, fontSize: 14, lineHeight: 1.55 },
  components: {
    Button: {
      fontWeight: 550,
      paddingInline: 11,
      contentFontSizeSM: 13,
      paddingInlineSM: 6,
    },
    Form: {
      itemMarginBottom: 13,
      verticalLabelPadding: '0 0 5px',
      labelFontSize: 13,
    },
    Table: {
      cellPaddingBlock: 10,
      cellPaddingInline: 12,
      cellPaddingBlockSM: 10,
      cellPaddingInlineSM: 8,
    },
  },
};

export default function ProductPage({
  label,
  nested = false,
  heading,
  steps,
  children,
}: {
  label: string;
  nested?: boolean;
  heading?: ReactNode;
  steps?: ReactNode;
  children: ReactNode;
}) {
  const t = useProductText();
  const { styles } = useStyles();
  const items = [
    {
      title: (
        <span className="flex items-center gap-2">
          <AppstoreOutlined />
          {t('managerTitle')}
        </span>
      ),
    },
    ...(nested
      ? [
          {
            title: (
              <Button
                type="link"
                size="small"
                onClick={() => history.push('/product-manager/product')}
              >
                {t('title')}
              </Button>
            ),
          },
        ]
      : []),
    { title: <strong>{label}</strong> },
  ];
  return (
    <PageContainer
      title={false}
      pageHeaderRender={false}
      className={styles.pageContainer}
    >
      <ConfigProvider
        variant="outlined"
        theme={productTheme}
        button={{ autoInsertSpace: false }}
        form={{
          requiredMark: (label, { required }) => (
            <>
              {label}
              {required && (
                <span className={styles.required} aria-hidden="true" />
              )}
            </>
          ),
        }}
        modal={{
          classNames: {
            container: styles.modalContainer,
            header: styles.modalHeader,
            title: styles.modalTitle,
            body: styles.modalBody,
            footer: styles.modalFooter,
          },
        }}
      >
        <div className={styles.workspace}>
          <header
            className={`${styles.pageHeader} ${heading ? '' : styles.detailHeader}`}
          >
            <Breadcrumb
              className={styles.breadcrumb}
              items={items}
              separator={<RightOutlined />}
            />
            {heading}
            {steps}
          </header>
          <div className={styles.pageWork}>{children}</div>
        </div>
      </ConfigProvider>
    </PageContainer>
  );
}
