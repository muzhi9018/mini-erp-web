import {
  DeleteOutlined,
  EditOutlined,
  FolderOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { history, useAccess } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tree,
} from 'antd';
import { useState } from 'react';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/services/product/category';
import { listProducts } from '@/services/product/product';
import { useStyles } from '../index.style';
import ProductPage from '../ProductPage';
import {
  LoadError,
  ProductCount,
  ProductHeading,
  useProductText,
} from '../shared';
import { categoryOptions, flattenCategories, sameId } from '../utils';

type CategoryForm = Product.CategoryValues & {
  code: string;
};
export default function ProductCategories() {
  const t = useProductText();
  const { hasPermission } = useAccess();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['productCategories'],
    queryFn: listCategories,
  });
  const [selected, setSelected] = useState<string>();
  const [editor, setEditor] = useState<{
    category?: Product.Category;
    parent?: Product.Category;
  }>();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<CategoryForm>();
  const flat = flattenCategories(query.data ?? []);
  const current =
    flat.find((item) => sameId(item.category.id, selected)) ?? flat[0];
  const categoryProductsParams = {
    pageNum: 1,
    pageSize: 1,
    categoryId: current?.category.id,
  };
  const productCount = useQuery({
    queryKey: ['products', categoryProductsParams],
    queryFn: () => listProducts(categoryProductsParams),
    enabled: !!current && hasPermission('product-manager:product:query'),
  });
  const reload = async () => {
    await client.invalidateQueries({
      queryKey: ['productCategories'],
    });
    await client.invalidateQueries({
      queryKey: ['products'],
    });
    await client.invalidateQueries({
      queryKey: ['productDetail'],
    });
  };
  const openEditor = (
    category?: Product.Category,
    parent?: Product.Category,
  ) => {
    form.resetFields();
    form.setFieldsValue(
      category ?? {
        name: '',
        code: '',
        sortOrder: 0,
        remark: '',
      },
    );
    setEditor({
      category,
      parent,
    });
  };
  return (
    <ProductPage
      label={t('category.title')}
      heading={
        <ProductHeading
          title={t('category.title')}
          subtitle={t('category.subtitle')}
          actions={
            hasPermission('product-manager:product-category:create') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openEditor()}
              >
                {t('category.create')}
              </Button>
            )
          }
        />
      }
    >
      {query.isError ? (
        <LoadError retry={() => void query.refetch()} />
      ) : (
        <Spin spinning={query.isPending}>
          <div className="grid grid-cols-1 items-start gap-[15px] md:grid-cols-[minmax(220px,1fr)_minmax(0,1.65fr)]">
            <section className={styles.panel}>
              <h2
                className={`m-0 border-b px-[17px] py-[15px] text-[19px] font-semibold ${styles.divider}`}
              >
                {t('category.tree')}
              </h2>
              <div className="p-[9px]">
                {flat.length ? (
                  <Tree
                    key={flat.map((item) => item.category.id).join(',')}
                    treeData={categoryOptions(query.data ?? [])}
                    titleRender={(node) => (
                      <span className="flex items-center gap-2">
                        <FolderOutlined />
                        {node.title}
                        {sameId(node.key, current?.category.id) &&
                          productCount.data && (
                            <ProductCount>
                              {productCount.data.total}
                            </ProductCount>
                          )}
                      </span>
                    )}
                    defaultExpandAll
                    blockNode
                    selectedKeys={current ? [String(current.category.id)] : []}
                    onSelect={(keys) => {
                      if (keys[0] != null) setSelected(String(keys[0]));
                    }}
                  />
                ) : (
                  <Empty description={t('category.empty')} />
                )}
              </div>
            </section>
            {current ? (
              <section className={`${styles.panel} ${styles.content}`}>
                <header className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="m-0 text-[19px] font-semibold">
                      {current.category.name}
                    </h2>
                    <p className={`mt-1 ${styles.muted}`}>{current.path}</p>
                  </div>
                  <Space wrap>
                    {hasPermission(
                      'product-manager:product-category:create',
                    ) && (
                      <Button
                        icon={<PlusOutlined />}
                        disabled={current.depth >= 3}
                        onClick={() => openEditor(undefined, current.category)}
                      >
                        {t('category.addChild')}
                      </Button>
                    )}
                    {hasPermission(
                      'product-manager:product-category:update',
                    ) && (
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => openEditor(current.category)}
                      >
                        {t('edit')}
                      </Button>
                    )}
                  </Space>
                </header>
                <dl className="my-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {[
                    [t('category.code'), current.category.code],
                    [
                      t('category.depth'),
                      t('category.depthValue', { depth: current.depth }),
                    ],
                    [t('sortOrder'), current.category.sortOrder],
                    [
                      t('category.children'),
                      current.category.children?.length ?? 0,
                    ],
                    ...(productCount.data
                      ? [[t('category.productCount'), productCount.data.total]]
                      : []),
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className={`mb-1 text-xs ${styles.muted}`}>
                        {label}
                      </dt>
                      <dd className="m-0 wrap-anywhere">{value}</dd>
                    </div>
                  ))}
                </dl>
                {current.depth === 3 && (
                  <Alert
                    className="mb-4"
                    type="info"
                    title={t('category.maxDepth')}
                  />
                )}
                <div className="my-4">
                  <h3 className="mb-1 text-[15px] font-semibold">
                    {t('category.remark')}
                  </h3>
                  <p
                    className={`whitespace-pre-wrap wrap-anywhere ${styles.muted}`}
                  >
                    {current.category.remark || '—'}
                  </p>
                </div>
                <Space wrap>
                  {hasPermission('product-manager:product:query') && (
                    <Button
                      type="link"
                      onClick={() =>
                        history.push(
                          `/product-manager/product?categoryId=${encodeURIComponent(String(current.category.id))}`,
                        )
                      }
                    >
                      {t('category.viewProducts')}
                    </Button>
                  )}
                  {hasPermission('product-manager:product-category:delete') && (
                    <Popconfirm
                      title={t('delete')}
                      description={t('category.deleteConfirm', {
                        name: current.category.name,
                      })}
                      onConfirm={async () => {
                        try {
                          await deleteCategory(current.category.id);
                          message.success(t('deleted'));
                          await reload();
                        } catch {
                          /* Global request handler reports errors. */
                        }
                      }}
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        disabled={Boolean(
                          current.category.children?.length ||
                            productCount.data?.total,
                        )}
                      >
                        {t('delete')}
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </section>
            ) : (
              <div className={styles.panel}>
                <Empty description={t('category.empty')} />
              </div>
            )}
          </div>
        </Spin>
      )}
      {editor && (
        <Modal
          open
          title={t(
            editor.category
              ? 'category.edit'
              : editor.parent
                ? 'category.addChild'
                : 'category.create',
          )}
          confirmLoading={saving}
          onCancel={() => {
            if (!saving) setEditor(undefined);
          }}
          onOk={() => form.submit()}
          okText={t('save')}
          cancelText={t('cancel')}
          mask={{
            closable: false,
          }}
        >
          <Form
            className={styles.form}
            form={form}
            layout="vertical"
            disabled={saving}
            onFinish={async (values) => {
              setSaving(true);
              try {
                const data = {
                  name: values.name.trim(),
                  sortOrder: values.sortOrder ?? 0,
                  remark: values.remark?.trim() || null,
                };
                if (editor.category)
                  await updateCategory({
                    id: editor.category.id,
                    ...data,
                  });
                else
                  await createCategory({
                    ...data,
                    code: values.code.trim(),
                    parentId: editor.parent?.id ?? 0,
                  });
                message.success(t('saved'));
                setEditor(undefined);
                await reload();
              } catch {
                /* Preserve input on failure. */
              } finally {
                setSaving(false);
              }
            }}
          >
            <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
              <Form.Item label={t('category.parent')}>
                <Input
                  disabled
                  value={
                    editor.parent?.name ??
                    (editor.category
                      ? flat.find((item) =>
                          sameId(item.category.id, editor.category?.parentId),
                        )?.path
                      : undefined) ??
                    t('category.root')
                  }
                />
              </Form.Item>
              <Form.Item
                name="code"
                label={t('category.code')}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                  },
                ]}
              >
                <Input disabled={Boolean(editor.category)} maxLength={64} />
              </Form.Item>
              <Form.Item
                name="name"
                label={t('category.name')}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                  },
                ]}
              >
                <Input maxLength={128} />
              </Form.Item>
              <Form.Item name="sortOrder" label={t('sortOrder')}>
                <InputNumber min={-2147483648} max={2147483647} precision={0} />
              </Form.Item>
              <Form.Item
                name="remark"
                label={t('category.remark')}
                className="col-span-full"
              >
                <Input.TextArea rows={3} maxLength={1000} showCount />
              </Form.Item>
            </div>
          </Form>
        </Modal>
      )}
    </ProductPage>
  );
}
