import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccess } from '@umijs/max';
import {
  App,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
} from 'antd';
import { useState } from 'react';
import {
  createUnit,
  deleteUnit,
  listUnits,
  updateUnit,
} from '@/services/product/unit';
import { useStyles } from '../index.style';
import ProductPage from '../ProductPage';
import { LoadError, ProductHeading, useProductText } from '../shared';
export default function ProductUnits() {
  const t = useProductText();
  const { hasPermission } = useAccess();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['productUnits'],
    queryFn: listUnits,
  });
  const [keyword, setKeyword] = useState('');
  const [editor, setEditor] = useState<{
    unit?: Product.Unit;
  }>();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<Product.UnitValues>();
  const openEditor = (unit?: Product.Unit) => {
    form.resetFields();
    form.setFieldsValue(
      unit ?? {
        code: '',
        name: '',
        sortOrder: 0,
      },
    );
    setEditor({
      unit,
    });
  };
  const reload = async () => {
    await client.invalidateQueries({
      queryKey: ['productUnits'],
    });
    await client.invalidateQueries({
      queryKey: ['productDetail'],
    });
  };
  const matches = (query.data ?? []).filter((unit) =>
    `${unit.code} ${unit.name}`
      .toLowerCase()
      .includes(keyword.trim().toLowerCase()),
  );
  return (
    <ProductPage
      label={t('unit.title')}
      heading={
        <ProductHeading
          title={t('unit.title')}
          subtitle={t('unit.subtitle')}
          actions={
            hasPermission('product-manager:product-unit:create') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openEditor()}
              >
                {t('unit.create')}
              </Button>
            )
          }
        />
      }
    >
      {query.isError ? (
        <LoadError retry={() => void query.refetch()} />
      ) : (
        <div className={styles.panel}>
          <div className={styles.filters}>
            <Input
              prefix={<SearchOutlined />}
              className="max-w-[335px]"
              value={keyword}
              allowClear
              placeholder={t('unit.search')}
              aria-label={t('unit.search')}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <Table<Product.Unit>
            rowKey="id"
            loading={query.isPending}
            className={styles.table}
            dataSource={matches}
            pagination={false}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('unit.empty')}
                />
              ),
            }}
            scroll={{
              x: 650,
            }}
            columns={[
              {
                title: t('unit.name'),
                dataIndex: 'name',
                render: (name) => <strong>{name}</strong>,
              },
              {
                title: t('unit.code'),
                dataIndex: 'code',
                render: (code) => <span className={styles.mono}>{code}</span>,
              },
              {
                title: t('sortOrder'),
                dataIndex: 'sortOrder',
              },
              {
                title: t('actions'),
                key: 'actions',
                align: 'right',
                render: (_, unit) => (
                  <Space>
                    {hasPermission('product-manager:product-unit:update') && (
                      <Button type="link" onClick={() => openEditor(unit)}>
                        {t('edit')}
                      </Button>
                    )}
                    {hasPermission('product-manager:product-unit:delete') && (
                      <Popconfirm
                        title={t('delete')}
                        description={t('unit.deleteConfirm', {
                          name: unit.name,
                        })}
                        onConfirm={async () => {
                          try {
                            await deleteUnit(unit.id);
                            message.success(t('deleted'));
                            await reload();
                          } catch {
                            /* Global request handler reports errors. */
                          }
                        }}
                      >
                        <Button type="link" danger>
                          {t('delete')}
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>
                ),
              },
            ]}
          />
          <div role="status" className={`px-4 py-3 text-xs ${styles.muted}`}>
            {t('unit.total', { total: matches.length })}
          </div>
        </div>
      )}
      {editor && (
        <Modal
          open
          title={t(editor.unit ? 'unit.edit' : 'unit.create')}
          okText={t('save')}
          cancelText={t('cancel')}
          confirmLoading={saving}
          mask={{
            closable: false,
          }}
          onCancel={() => {
            if (!saving) setEditor(undefined);
          }}
          onOk={() => form.submit()}
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
                };
                if (editor.unit)
                  await updateUnit({
                    ...data,
                    id: editor.unit.id,
                  });
                else
                  await createUnit({
                    ...data,
                    code: values.code.trim(),
                  });
                message.success(t('saved'));
                setEditor(undefined);
                await reload();
              } catch {
                /* Preserve input when a referenced unit cannot change. */
              } finally {
                setSaving(false);
              }
            }}
          >
            <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
              <Form.Item
                name="name"
                label={t('unit.name')}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                  },
                ]}
              >
                <Input maxLength={32} />
              </Form.Item>
              <Form.Item
                name="code"
                label={t('unit.code')}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                  },
                ]}
                extra={editor.unit ? t('codeFixed') : undefined}
              >
                <Input maxLength={32} disabled={Boolean(editor.unit)} />
              </Form.Item>
              <Form.Item name="sortOrder" label={t('sortOrder')}>
                <InputNumber min={-2147483648} max={2147483647} precision={0} />
              </Form.Item>
            </div>
          </Form>
        </Modal>
      )}
    </ProductPage>
  );
}
