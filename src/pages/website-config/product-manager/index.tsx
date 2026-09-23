import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Modal, message, Popconfirm, Select } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { Access, useAccess } from 'umi';
import { getSystemLocales } from '@/services/system/locale';
import {
  deleteProduct,
  getProductDetail,
  listProductLocales,
  listProducts,
} from '@/services/website/product';
import ProductForm from './ProductForm';

type ProductEditor =
  | { mode: 'create' }
  | { mode: 'addLanguage'; product: Website.Product }
  | { mode: 'edit'; product: Website.PublicProduct };

type ProductLanguageSelector = {
  product: Website.Product;
  locales: System.SystemLocale[];
  selectedLocale?: string;
};

const ProductManager = () => {
  const { hasPermission } = useAccess();
  const intl = useIntl();
  const t = (
    key: string,
    defaultMessage: string,
    values?: Record<string, string | number>,
  ) =>
    intl.formatMessage({ id: `productManager.${key}`, defaultMessage }, values);
  const actionRef = useRef<ActionType>(undefined);
  const [editor, setEditor] = useState<ProductEditor>();
  const [loadingLocalesProductId, setLoadingLocalesProductId] =
    useState<Website.Product['id']>();
  const [deletingProductId, setDeletingProductId] =
    useState<Website.Product['id']>();
  const [languageSelector, setLanguageSelector] =
    useState<ProductLanguageSelector>();
  const [loadingProductDetail, setLoadingProductDetail] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [languages, setLanguages] = useState<System.SystemLocale[]>([]);
  useEffect(() => {
    let active = true;
    getSystemLocales()
      .then((locales) => {
        if (active) setLanguages(locales);
      })
      .catch(() => {
        // 加载失败时保留语言编码展示，接口错误由全局请求处理器提示。
      });
    return () => {
      active = false;
    };
  }, []);
  const columns: ProColumns<Website.Product>[] = [
    { title: t('id', '商品 ID'), dataIndex: 'id', width: 100 },
    { title: t('name', '商品名称'), dataIndex: 'name', width: 100 },
    { title: t('slug', '商品标识'), dataIndex: 'slug', width: 100 },
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
        languages.map(({ code, nativeName, name }) => [
          code,
          nativeName || name,
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
      width: 280,
      fixed: 'right',
      render: (_, product) => [
        <Access
          key="access-edit"
          accessible={hasPermission('website-config:product-manager:update')}
        >
          <Button
            key="edit"
            type="link"
            icon={<EditOutlined />}
            loading={loadingLocalesProductId === product.id}
            disabled={
              deletingProductId !== undefined ||
              (loadingLocalesProductId !== undefined &&
                loadingLocalesProductId !== product.id)
            }
            onClick={async () => {
              setLoadingLocalesProductId(product.id);
              try {
                const locales = await listProductLocales(product.id);
                if (!locales.length) {
                  messageApi.warning(
                    t('noConfiguredLanguage', '该商品暂未配置可修改的语言。'),
                  );
                  return;
                }
                setLanguageSelector({ product, locales });
              } catch {
                // 接口错误由全局请求处理器提示，加载失败时保留列表页。
              } finally {
                setLoadingLocalesProductId(undefined);
              }
            }}
          >
            {t('edit', '修改')}
          </Button>
        </Access>,
        <Access
          key="access-add-i18n"
          accessible={hasPermission('website-config:product-manager:add-i18n')}
        >
          <Button
            key="language"
            type="link"
            disabled={
              loadingLocalesProductId !== undefined ||
              deletingProductId !== undefined
            }
            onClick={() => setEditor({ mode: 'addLanguage', product })}
          >
            {t('addLanguage', '添加商品语言')}
          </Button>
        </Access>,
        <Access
          key="access-add-i18n"
          accessible={hasPermission('website-config:product-manager:delete')}
        >
          <Popconfirm
            key="delete"
            title={t('deleteConfirmTitle', '删除商品“{name}”？', {
              name: product.name,
            })}
            description={t(
              'deleteConfirmDescription',
              '删除后，该商品及其全部语言内容将被永久移除，且无法恢复。',
            )}
            okText={t('confirmDelete', '确认删除')}
            cancelText={t('cancel', '取消')}
            okButtonProps={{
              danger: true,
              loading: deletingProductId === product.id,
            }}
            disabled={
              loadingLocalesProductId !== undefined ||
              deletingProductId !== undefined
            }
            onConfirm={async () => {
              setDeletingProductId(product.id);
              try {
                await deleteProduct(product.id);
                messageApi.success(
                  t('deleteSuccess', '商品已删除（{name}）', {
                    name: product.name,
                  }),
                );
                void actionRef.current?.reload();
              } catch {
                // 接口错误由全局请求处理器提示，删除失败时保留当前列表。
              } finally {
                setDeletingProductId(undefined);
              }
            }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={deletingProductId === product.id}
              disabled={
                loadingLocalesProductId !== undefined ||
                deletingProductId !== undefined
              }
            >
              {t('delete', '删除')}
            </Button>
          </Popconfirm>
        </Access>,
      ],
    },
  ];

  return (
    <>
      {contextHolder}
      <Modal
        title={t('selectEditLanguage', '选择修改语言')}
        open={Boolean(languageSelector)}
        destroyOnHidden
        centered
        footer={null}
        closable={!loadingProductDetail}
        keyboard={!loadingProductDetail}
        mask={{ closable: false }}
        onCancel={() => {
          if (!loadingProductDetail) setLanguageSelector(undefined);
        }}
      >
        <p>
          {t(
            'selectEditLanguageDescription',
            '请选择要修改的“{name}”内容语言。',
            {
              name: languageSelector?.product.name ?? '',
            },
          )}
        </p>
        <label htmlFor="product-edit-locale">
          {t('editLanguageLabel', '商品语言')}
        </label>
        <Select
          id="product-edit-locale"
          className="mt-2 w-full"
          disabled={loadingProductDetail}
          loading={loadingProductDetail}
          placeholder={t('editLanguagePlaceholder', '请选择商品语言')}
          value={languageSelector?.selectedLocale}
          options={languageSelector?.locales.map(
            ({ code, nativeName, name }) => ({
              label: nativeName || name,
              value: code,
            }),
          )}
          onChange={async (selectedLocale) => {
            if (!languageSelector || loadingProductDetail) return;
            const { product } = languageSelector;
            setLanguageSelector({ ...languageSelector, selectedLocale });
            setLoadingProductDetail(true);
            try {
              const detail = await getProductDetail(product.id, selectedLocale);
              setLanguageSelector(undefined);
              setEditor({ mode: 'edit', product: detail });
            } catch {
              setLanguageSelector((current) =>
                current ? { ...current, selectedLocale: undefined } : current,
              );
              // 接口错误由全局请求处理器提示，加载失败时保留语言选择弹窗。
            } finally {
              setLoadingProductDetail(false);
            }
          }}
        />
        <div className="mt-6 flex justify-end">
          <Button
            disabled={loadingProductDetail}
            onClick={() => setLanguageSelector(undefined)}
          >
            {t('cancel', '取消')}
          </Button>
        </div>
      </Modal>
      {editor ? (
        <ProductForm
          product={editor.mode === 'addLanguage' ? editor.product : undefined}
          editProduct={editor.mode === 'edit' ? editor.product : undefined}
          onClose={() => setEditor(undefined)}
          onSuccess={(_locale, languageName) => {
            messageApi.success(
              editor.mode === 'edit'
                ? t('updateSuccess', '商品已修改（{language}）', {
                    language: languageName,
                  })
                : editor.mode === 'addLanguage'
                  ? t('languageSuccess', '商品语言已添加（{language}）', {
                      language: languageName,
                    })
                  : t('createSuccess', '商品已创建（{language}）', {
                      language: languageName,
                    }),
            );
            setEditor(undefined);
            void actionRef.current?.reload();
          }}
        />
      ) : (
        <PageContainer
          title={t('title', '商品管理')}
          subTitle={t('subtitleList', '管理官网商品及各语言的展示内容')}
        >
          <ProTable<Website.Product>
            actionRef={actionRef}
            rowKey="id"
            headerTitle={t('list', '商品列表')}
            columns={columns}
            tooltip={t(
              'listHint',
              '列表按当前界面语言展示。新增其他语言后，可切换界面语言查看。',
            )}
            toolBarRender={() => [
              <Access
                key="access-edit"
                accessible={hasPermission(
                  'website-config:product-manager:create',
                )}
              >
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setEditor({ mode: 'create' })}
                >
                  {t('create', '新增商品')}
                </Button>
              </Access>,
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
