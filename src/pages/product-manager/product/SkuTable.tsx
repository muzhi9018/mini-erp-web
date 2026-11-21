import { FilterOutlined, PictureOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useAccess } from '@umijs/max';
import type { TableProps } from 'antd';
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
} from 'antd';
import { type ReactNode, useState } from 'react';
import {
  changeSkuStatus,
  deleteSku,
  getProduct,
  listSkus,
} from '@/services/product/product';
import { useStyles } from '../index.style';
import {
  DecimalField,
  LoadError,
  MoreProductActions,
  StatusTag,
  useProductText,
  useProductUnits,
  useRefreshProduct,
} from '../shared';
import { coverImage, formatSkuPrice, normalizeDecimal } from '../utils';
import EditModal, { type ProductEdit } from './EditModal';
import ImageEditor from './ImageEditor';
import StockModal from './StockModal';

type Filters = {
  keyword?: string;
  skuStatus?: Product.Status;
  specs?: Omit<Product.SpecFilter, 'specId'>[];
};
export default function SkuTable({
  product,
  title,
  actions,
  notice,
}: {
  product: Product.Detail;
  title?: ReactNode;
  actions?: ReactNode;
  notice?: ReactNode;
}) {
  const t = useProductText();
  const { styles } = useStyles();
  const [form] = Form.useForm<Filters>();
  const [filterOpen, setFilterOpen] = useState(false);
  const filters: Filters['specs'] = Form.useWatch('specs', form) ?? [];
  const [query, setQuery] = useState<Partial<Product.SkuQuery>>({});
  const [page, setPage] = useState({
    pageNum: 1,
    pageSize: 15,
  });
  const params = {
    ...query,
    ...page,
    productId: product.id,
  };
  const result = useQuery({
    queryKey: ['productSkus', String(product.id), params],
    queryFn: () => listSkus(params),
  });
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 px-[17px] py-[15px]">
        {title}
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <Button
            type="text"
            className={styles.quiet}
            icon={<FilterOutlined />}
            aria-label={t('skuFilters')}
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((open) => !open)}
          />
          {actions}
        </div>
      </div>
      {notice}
      <div hidden={!filterOpen} className="px-4 pb-3">
        <Form
          className={styles.form}
          form={form}
          onFinish={(values) => {
            setQuery({
              keyword: values.keyword?.trim() || undefined,
              skuStatus: values.skuStatus,
              specs: (values.specs ?? []).flatMap((value, index) => {
                if (
                  !value ||
                  (value.specValueId == null &&
                    (value.minimum == null || value.minimum === '') &&
                    (value.maximum == null || value.maximum === ''))
                )
                  return [];
                return [
                  {
                    specId: product.specs[index].id,
                    ...(value.specValueId != null
                      ? {
                          specValueId: value.specValueId,
                        }
                      : {
                          minimum:
                            value.minimum === '' ? undefined : value.minimum,
                          maximum:
                            value.maximum === '' ? undefined : value.maximum,
                        }),
                  },
                ];
              }),
            });
            setPage({
              ...page,
              pageNum: 1,
            });
          }}
        >
          <div className="flex flex-wrap items-start gap-3">
            <Form.Item
              name="keyword"
              className="w-full sm:w-72"
              style={{ marginBottom: 0 }}
            >
              <Input
                placeholder={t('searchSku')}
                aria-label={t('searchSku')}
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="skuStatus"
              className="w-40"
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder={t('allStatuses')}
                aria-label={t('status')}
                allowClear
                options={[
                  {
                    value: 'ENABLED',
                    label: t('enabled'),
                  },
                  {
                    value: 'DISABLED',
                    label: t('disabled'),
                  },
                ]}
              />
            </Form.Item>
            <Button htmlType="submit" type="primary">
              {t('applyFilters')}
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                setQuery({});
                setPage({
                  ...page,
                  pageNum: 1,
                });
              }}
            >
              {t('reset')}
            </Button>
          </div>
          {!!product.specs.length && (
            <details className="mt-3">
              <summary className="cursor-pointer">{t('filterBySpec')}</summary>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {product.specs.map((spec, index) => (
                  <div key={spec.id}>
                    <Form.Item
                      name={['specs', index, 'specValueId']}
                      label={spec.name}
                      className="mb-2"
                    >
                      <Select
                        allowClear
                        disabled={
                          (filters[index]?.minimum != null &&
                            filters[index]?.minimum !== '') ||
                          (filters[index]?.maximum != null &&
                            filters[index]?.maximum !== '')
                        }
                        options={spec.values.map((value) => ({
                          value: value.id,
                          label: String(value.textValue ?? value.numberValue),
                        }))}
                      />
                    </Form.Item>
                    {spec.valueType === 'NUMBER' && (
                      <div className="grid grid-cols-2 gap-2">
                        <DecimalField
                          name={['specs', index, 'minimum']}
                          label={t('min')}
                          signed
                          disabled={filters[index]?.specValueId != null}
                        />
                        <DecimalField
                          name={['specs', index, 'maximum']}
                          label={t('max')}
                          signed
                          disabled={filters[index]?.specValueId != null}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </Form>
      </div>
      {result.isError && !result.data ? (
        <LoadError retry={() => void result.refetch()} />
      ) : (
        <SkuRows
          product={product}
          loading={result.isFetching}
          dataSource={result.data?.records}
          scroll={{ x: 900 }}
          pagination={{
            current: page.pageNum,
            hideOnSinglePage: true,
            pageSize: page.pageSize,
            total: result.data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) =>
              t('total', {
                total,
              }),
            onChange: (pageNum, pageSize) =>
              setPage({
                pageNum,
                pageSize,
              }),
          }}
        />
      )}
    </>
  );
}

export function InlineSkuTable({ product }: { product: Product.Item }) {
  const t = useProductText();
  const id = String(product.id);
  const result = useQuery({
    queryKey: ['productDetail', id],
    queryFn: () => getProduct(id),
  });
  return (
    <section aria-label={t('inlineSkuList', { name: product.name })}>
      {result.isError && !result.data ? (
        <LoadError retry={() => void result.refetch()} />
      ) : (
        <SkuRows
          product={result.data}
          productCover={product.coverImageUrl}
          inline
          loading={result.isFetching}
          dataSource={result.data?.skus}
          pagination={false}
        />
      )}
    </section>
  );
}

function SkuRows({
  product,
  productCover,
  inline = false,
  ...table
}: Pick<
  TableProps<Product.Sku>,
  'dataSource' | 'loading' | 'pagination' | 'scroll'
> & {
  product?: Product.Detail;
  productCover?: string;
  inline?: boolean;
}) {
  const t = useProductText();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const { hasPermission } = useAccess();
  const canEdit = hasPermission('product-manager:product:update');
  const units = useProductUnits();
  const [editor, setEditor] = useState<ProductEdit>();
  const [stockSku, setStockSku] = useState<Product.Id>();
  const [imageSku, setImageSku] = useState<Product.Sku>();
  const refresh = useRefreshProduct(product?.id ?? '');
  const fallbackImage = coverImage(product?.images ?? []);
  const fallbackCover = fallbackImage?.url ?? productCover;
  const mutate = async (operation: () => Promise<unknown>) => {
    try {
      await operation();
      message.success(t('saved'));
      await refresh();
    } catch {
      /* The request handler reports failures. */
    }
  };
  return (
    <>
      <Table<Product.Sku>
        {...table}
        rowKey="id"
        size="small"
        tableLayout="auto"
        className={styles.table}
        columns={[
          {
            title: t('skuIdentity'),
            key: 'identity',
            width: inline ? '19%' : '21%',
            render: (_, sku) => {
              const images = sku.images ?? [];
              const url = images.length
                ? coverImage(images)?.url
                : fallbackCover;
              return (
                <div
                  className={`flex items-center ${inline ? 'gap-[11px]' : 'gap-[7px]'}`}
                >
                  <button
                    type="button"
                    className={`block shrink-0 cursor-pointer rounded-[6px] p-0 ${inline ? 'w-[42px]' : ''}`}
                    aria-label={t('viewSkuImages', { code: sku.code })}
                    onClick={() => setImageSku(sku)}
                  >
                    <span
                      className={`${styles.thumbnail} ${styles.skuThumbnail}`}
                    >
                      {url ? (
                        <img src={url} alt="" className="block" />
                      ) : (
                        <PictureOutlined />
                      )}
                    </span>
                  </button>
                  <div className="min-w-0 wrap-anywhere">
                    <div className={`${styles.mono} font-semibold`}>
                      {sku.code}
                    </div>
                    <div className={styles.muted}>{sku.model || '—'}</div>
                  </div>
                </div>
              );
            },
          },
          {
            title: t('specification'),
            key: 'specification',
            width: inline ? '24%' : '29%',
            render: (_, sku) =>
              sku.specValues.some((spec) => spec.specName) ? (
                <div className="grid grid-cols-[repeat(2,minmax(0,max-content))] gap-x-3 gap-y-1">
                  {sku.specValues.map((spec) => (
                    <span className="wrap-anywhere" key={spec.specId}>
                      {spec.specName} {spec.textValue ?? spec.numberValue}{' '}
                      {spec.unitName}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="wrap-anywhere">
                  {sku.specificationText || t('defaultSpec')}
                </span>
              ),
          },
          {
            title: t('referencePrices'),
            key: 'price',
            width: inline ? '14%' : '17%',
            render: (_, sku) => (
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 text-xs tabular-nums">
                <span className={styles.muted}>{t('purchaseShort')}</span>
                <span className="wrap-anywhere">
                  {formatSkuPrice(
                    sku.referencePurchasePrice,
                    sku.referencePurchaseCurrency,
                  )}
                </span>
                <span className={styles.muted}>{t('saleShort')}</span>
                <span className="wrap-anywhere">
                  {formatSkuPrice(
                    sku.referenceSalePrice,
                    sku.referenceSaleCurrency,
                  )}
                </span>
              </div>
            ),
          },
          {
            title: t('currentStock'),
            key: 'stock',
            width: '8%',
            render: (_, sku) => (
              <span className="wrap-anywhere tabular-nums">
                {normalizeDecimal(sku.stockQuantity)} {sku.unitName}
                <small className={`block ${styles.muted}`}>
                  {t('quantityScaleShort', { scale: sku.quantityScale })}
                </small>
              </span>
            ),
          },
          {
            title: t('status'),
            dataIndex: 'status',
            render: (value) => <StatusTag status={value} />,
            width: '11%',
          },
          {
            title: t('actions'),
            key: 'actions',
            align: 'right',
            render: (_, sku) => {
              const nextStatus =
                sku.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
              const statusLabel = t(
                nextStatus === 'ENABLED' ? 'enabled' : 'disabled',
              );
              const cannotDelete = normalizeDecimal(sku.stockQuantity) !== '0';
              const stock = hasPermission(
                'product-manager:product:stock:set',
              ) && (
                <Button
                  type="link"
                  className={styles.rowAction}
                  size="small"
                  onClick={() => setStockSku(sku.id)}
                >
                  {t('stock')}
                </Button>
              );
              const actions = (close?: () => void) => (
                <>
                  {canEdit && units.data && (
                    <Button
                      type="link"
                      className={styles.rowAction}
                      size="small"
                      onClick={() => {
                        close?.();
                        setEditor({ type: 'sku', sku });
                      }}
                    >
                      {t('edit')}
                    </Button>
                  )}
                  {inline && stock}
                  {canEdit && (
                    <Button
                      type="link"
                      className={styles.rowAction}
                      size="small"
                      onClick={() => {
                        close?.();
                        setEditor({ type: 'skuImages', sku });
                      }}
                    >
                      {t('skuImagesAction')}
                    </Button>
                  )}
                  {hasPermission('product-manager:product:change-status') && (
                    <Popconfirm
                      title={t('statusConfirm', {
                        name: sku.code,
                        status: statusLabel,
                      })}
                      onConfirm={() =>
                        mutate(() =>
                          changeSkuStatus({
                            id: sku.id,
                            expectedVersion: sku.version,
                            status: nextStatus,
                          }),
                        )
                      }
                    >
                      <Button type="link" size="small">
                        {statusLabel}
                      </Button>
                    </Popconfirm>
                  )}
                  {hasPermission('product-manager:product:delete') && (
                    <Popconfirm
                      title={t('delete')}
                      description={t('deleteConfirm', { name: sku.code })}
                      onConfirm={() =>
                        mutate(() =>
                          deleteSku({
                            id: sku.id,
                            expectedVersion: sku.version,
                          }),
                        )
                      }
                    >
                      <Button
                        danger
                        type="link"
                        className={styles.rowAction}
                        size="small"
                        disabled={cannotDelete}
                        title={cannotDelete ? t('nonzeroStock') : undefined}
                      >
                        {t('delete')}
                      </Button>
                    </Popconfirm>
                  )}
                </>
              );
              return (
                <div className="flex flex-wrap items-center justify-end gap-x-1">
                  {inline ? (
                    actions()
                  ) : (
                    <>
                      {stock}
                      {(canEdit ||
                        hasPermission(
                          'product-manager:product:change-status',
                        ) ||
                        hasPermission('product-manager:product:delete')) && (
                        <MoreProductActions
                          label={t('moreSkuActions', { code: sku.code })}
                          title={t('skuActions')}
                          code={sku.code}
                        >
                          {actions}
                        </MoreProductActions>
                      )}
                    </>
                  )}
                </div>
              );
            },
          },
        ]}
      />
      {imageSku && (
        <Modal
          open
          title={t('skuImages')}
          width={640}
          onCancel={() => setImageSku(undefined)}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setImageSku(undefined)}>
                {t('close')}
              </Button>
              {canEdit && product && (
                <Button
                  type="primary"
                  onClick={() => {
                    setEditor({ type: 'skuImages', sku: imageSku });
                    setImageSku(undefined);
                  }}
                >
                  {t('manageImages')}
                </Button>
              )}
            </div>
          }
        >
          <p className="mb-2 font-semibold">{imageSku.code}</p>
          {imageSku.specificationText && (
            <p className={styles.muted}>{imageSku.specificationText}</p>
          )}
          {!imageSku.images?.length && fallbackImage && (
            <p className={`mb-3 ${styles.muted}`}>{t('skuImageFallback')}</p>
          )}
          <ImageEditor
            readOnly
            value={
              imageSku.images?.length
                ? imageSku.images
                : fallbackImage
                  ? [fallbackImage]
                  : []
            }
          />
        </Modal>
      )}
      {product && editor && (
        <EditModal
          editor={editor}
          product={product}
          categories={[]}
          units={units.data ?? []}
          onClose={() => setEditor(undefined)}
          onSaved={refresh}
        />
      )}
      {product && stockSku != null && (
        <StockModal
          productId={product.id}
          skuId={stockSku}
          onClose={() => setStockSku(undefined)}
          onSaved={refresh}
        />
      )}
    </>
  );
}
