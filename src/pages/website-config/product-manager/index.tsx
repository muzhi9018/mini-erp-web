import { PlusOutlined } from '@ant-design/icons';
import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, message } from 'antd';
import { useState } from 'react';
import { listProducts } from '@/services/website/product';
import { categoryLanguages } from '../category-manager/CategoryForm';
import ProductForm from './ProductForm';

const ProductManager = () => {
  const intl = useIntl();
  const t = (
    key: string,
    defaultMessage: string,
    values?: Record<string, string | number>,
  ) =>
    intl.formatMessage({ id: `productManager.${key}`, defaultMessage }, values);
  const [editor, setEditor] = useState<{ product?: Website.Product }>();
  const [messageApi, contextHolder] = message.useMessage();
  const columns: ProColumns<Website.Product>[] = [
    { title: t('id', '商品 ID'), dataIndex: 'id', width: 190 },
    { title: t('name', '商品名称'), dataIndex: 'name' },
    { title: t('slug', '商品标识'), dataIndex: 'slug' },
    {
      title: t('categoryId', '所属分类 ID'),
      dataIndex: 'categoryId',
      width: 190,
    },
    {
      title: t('language', '内容语言'),
      dataIndex: 'locale',
      width: 120,
      valueEnum: Object.fromEntries(
        categoryLanguages.map(({ label, value }) => [
          value,
          intl.formatMessage(label),
        ]),
      ),
    },
    { title: t('sortOrder', '展示排序'), dataIndex: 'sortOrder', width: 100 },
    {
      title: t('status', '官网状态'),
      dataIndex: 'isShow',
      width: 100,
      valueEnum: {
        true: { text: t('visible', '展示'), status: 'Success' },
        false: { text: t('hidden', '隐藏'), status: 'Default' },
      },
    },
    {
      title: t('actions', '操作'),
      valueType: 'option',
      width: 140,
      fixed: 'right',
      render: (_, product) => [
        <Button
          key="language"
          type="link"
          onClick={() => setEditor({ product })}
        >
          {t('addLanguage', '添加商品语言')}
        </Button>,
      ],
    },
  ];

  return (
    <>
      {contextHolder}
      {editor ? (
        <ProductForm
          product={editor.product}
          onClose={() => setEditor(undefined)}
          onSuccess={(locale) => {
            const language = categoryLanguages.find(
              ({ value }) => value === locale,
            );
            const languageName = language
              ? intl.formatMessage(language.label)
              : locale;
            messageApi.success(
              editor.product
                ? t('languageSuccess', '商品语言已添加（{language}）', {
                    language: languageName,
                  })
                : t('createSuccess', '商品已创建（{language}）', {
                    language: languageName,
                  }),
            );
            setEditor(undefined);
          }}
        />
      ) : (
        <PageContainer
          title={t('title', '商品管理')}
          subTitle={t('subtitleList', '管理官网商品及各语言的展示内容')}
        >
          <ProTable<Website.Product>
            rowKey="id"
            headerTitle={t('list', '商品列表')}
            columns={columns}
            tooltip={t(
              'listHint',
              '列表按当前界面语言展示。新增其他语言后，可切换界面语言查看。',
            )}
            toolBarRender={() => [
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setEditor({})}
              >
                {t('create', '新增商品')}
              </Button>,
            ]}
            params={{ locale: intl.locale }}
            request={async ({ current = 1, pageSize = 10 }) => {
              const page = await listProducts({ pageNum: current, pageSize });
              return { data: page.records, total: page.total, success: true };
            }}
            search={false}
            options={false}
            pagination={{
              defaultPageSize: 10,
              showTotal: (total) =>
                intl.formatMessage(
                  {
                    id: 'productManager.total',
                    defaultMessage: '共 {total} 条',
                  },
                  { total },
                ),
            }}
            scroll={{ x: 1200 }}
          />
        </PageContainer>
      )}
    </>
  );
};

export default ProductManager;
