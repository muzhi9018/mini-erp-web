import {
  DownOutlined,
  EditOutlined,
  LockOutlined,
  PictureOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { history, useAccess, useParams } from '@umijs/max';
import { Alert, App, Button, Collapse, Empty, Image, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  changeProductStatus,
  deleteProduct,
  getProduct,
} from '@/services/product/product';
import { useStyles } from '../../index.style';
import ProductPage from '../../ProductPage';
import {
  LoadError,
  MoreProductActions,
  ProductCount,
  StatusTag,
  useProductCategories,
  useProductText,
  useProductUnits,
  useRefreshProduct,
} from '../../shared';
import {
  coverImage,
  flattenCategories,
  normalizeDecimal,
  sameId,
} from '../../utils';
import AddSkusModal from '../AddSkusModal';
import EditModal, { type ProductEdit } from '../EditModal';
import SkuTable from '../SkuTable';
export default function ProductDetail() {
  const { id = '' } = useParams<{
    id: string;
  }>();
  const t = useProductText();
  const { styles } = useStyles();
  const { message, modal } = App.useApp();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['productDetail', id],
    queryFn: () => getProduct(id),
  });
  const { hasPermission } = useAccess();
  const canEdit = hasPermission('product-manager:product:update');
  const categories = useProductCategories();
  const units = useProductUnits();
  const [editor, setEditor] = useState<ProductEdit>();
  const [addSkus, setAddSkus] = useState(false);
  const product = query.data;
  const refresh = useRefreshProduct(id);
  const cover = coverImage(product?.images ?? []);
  const specUsed = (value: Product.SpecValue) =>
    product?.skus.some((sku) =>
      sku.specValues.some((selection) =>
        sameId(selection.specValueId, value.id),
      ),
    );
  return (
    <ProductPage label={t('detail')} nested>
      {query.isError && !product ? (
        <LoadError retry={() => void query.refetch()} />
      ) : !product ? (
        <Spin />
      ) : (
        <>
          {(categories.isError || units.isError) && (
            <LoadError
              retry={() => {
                if (categories.isError) void categories.refetch();
                if (units.isError) void units.refetch();
              }}
            />
          )}
          <div className="flex min-w-0 flex-col gap-4">
            <section
              className={`${styles.panel} ${styles.content}`}
              aria-label={t('overview')}
            >
              <header className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={styles.mono}>{product.code}</span>
                    <StatusTag status={product.status} />
                    <ProductCount>V{product.version}</ProductCount>
                  </div>
                  <h1 className={styles.pageTitle}>{product.name}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canEdit &&
                    hasPermission('product-manager:product-category:query') && (
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        disabled={!categories.data}
                        onClick={() => setEditor({ type: 'info' })}
                      >
                        {t('editInfo')}
                      </Button>
                    )}
                  <MoreProductActions
                    label={t('moreProductActions')}
                    title={t('productActions')}
                    code={product.code}
                  >
                    {(close) => (
                      <>
                        {hasPermission(
                          'product-manager:product:change-status',
                        ) && (
                          <Button
                            onClick={() => {
                              const status =
                                product.status === 'ENABLED'
                                  ? 'DISABLED'
                                  : 'ENABLED';
                              close();
                              modal.confirm({
                                title: t('statusConfirm', {
                                  name: product.name,
                                  status: t(
                                    status === 'ENABLED'
                                      ? 'enabled'
                                      : 'disabled',
                                  ),
                                }),
                                onOk: async () => {
                                  await changeProductStatus({
                                    id: product.id,
                                    expectedVersion: product.version,
                                    status,
                                  });
                                  message.success(t('saved'));
                                  await refresh();
                                },
                              });
                            }}
                          >
                            {t(
                              product.status === 'ENABLED'
                                ? 'disableProduct'
                                : 'enableProduct',
                            )}
                          </Button>
                        )}
                        {hasPermission('product-manager:product:delete') && (
                          <Button
                            danger
                            disabled={product.skus.some(
                              (sku) =>
                                normalizeDecimal(sku.stockQuantity) !== '0',
                            )}
                            onClick={() => {
                              close();
                              modal.confirm({
                                title: t('deleteConfirm', {
                                  name: product.name,
                                }),
                                okButtonProps: { danger: true },
                                onOk: async () => {
                                  await deleteProduct({
                                    id: product.id,
                                    expectedVersion: product.version,
                                  });
                                  message.success(t('deleted'));
                                  await client.invalidateQueries({
                                    queryKey: ['products'],
                                  });
                                  history.replace('/product-manager/product');
                                },
                              });
                            }}
                          >
                            {t('deleteProduct')}
                          </Button>
                        )}
                        <Button
                          onClick={() => {
                            close();
                            void refresh();
                          }}
                        >
                          {t('refresh')}
                        </Button>
                      </>
                    )}
                  </MoreProductActions>
                </div>
              </header>
              <div
                className={`grid items-start gap-6 border-t pt-4 md:grid-cols-[minmax(0,min(37%,410px))_minmax(0,1fr)] ${styles.divider}`}
              >
                <section className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="m-0 text-base font-semibold">
                      {t('images')}{' '}
                      {!!product.images.length && (
                        <ProductCount>{product.images.length}</ProductCount>
                      )}
                    </h2>
                    {canEdit && (
                      <Button
                        type="text"
                        icon={<PictureOutlined />}
                        onClick={() => setEditor({ type: 'images' })}
                      >
                        {t('manageImages')}
                      </Button>
                    )}
                  </div>
                  {cover ? (
                    <Image.PreviewGroup>
                      <div className="flex flex-wrap items-start gap-2">
                        <div
                          className={`${styles.archivePhoto} relative aspect-square w-[clamp(168px,13cqw,232px)] max-w-full`}
                        >
                          <Image
                            src={cover.url}
                            alt={t('cover')}
                            width="100%"
                            height="100%"
                          />
                          <Tag
                            color="processing"
                            className="pointer-events-none absolute start-2 top-2"
                          >
                            {t('cover')}
                          </Tag>
                        </div>
                        {product.images.length > 1 && (
                          <div className="flex min-w-12 flex-1 flex-wrap gap-2">
                            {product.images
                              .filter((image) => image !== cover)
                              .map((image) => (
                                <div
                                  key={image.attachmentId}
                                  className={`${styles.archivePhoto} size-12`}
                                >
                                  <Image
                                    src={image.url}
                                    alt={t('images')}
                                    width="100%"
                                    height="100%"
                                  />
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </Image.PreviewGroup>
                  ) : (
                    <div className={styles.galleryPlaceholder}>
                      <PictureOutlined />
                      <span>{t('emptyImages')}</span>
                    </div>
                  )}
                </section>
                <section className={`${styles.archiveInfo} min-w-0`}>
                  <h2 className="mb-3 text-base font-semibold">
                    {t('archiveInfo')}
                  </h2>
                  <dl className="grid max-w-[730px] grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-x-4 gap-y-3">
                    {[
                      [
                        t('category'),
                        flattenCategories(categories.data ?? []).find(
                          ({ category }) =>
                            sameId(category.id, product.categoryId),
                        )?.path ??
                          product.categoryName ??
                          '—',
                      ],
                      [t('brand'), product.brand || '—'],
                      [
                        t('updatedAt'),
                        product.gmtModified
                          ? dayjs(product.gmtModified).format(
                              'YYYY-MM-DD HH:mm',
                            )
                          : '—',
                      ],
                      [t('sortOrder'), product.sortOrder],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className={`mb-1 text-xs ${styles.muted}`}>
                          {label}
                        </dt>
                        <dd className="m-0 text-[13px] font-medium wrap-anywhere">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <h3 className="mb-1 text-[15px] font-semibold">
                    {t('description')}
                  </h3>
                  <p className="max-w-[72ch] whitespace-pre-wrap wrap-anywhere">
                    {product.description || '—'}
                  </p>
                </section>
              </div>
            </section>
            <section className={styles.panel} aria-label={t('skuList')}>
              <SkuTable
                product={product}
                title={
                  <h2 className="m-0 flex items-center gap-2 text-[19px] font-semibold">
                    {t('skuList')}{' '}
                    <ProductCount>{product.skus.length}</ProductCount>
                  </h2>
                }
                actions={
                  canEdit &&
                  hasPermission('product-manager:product-unit:query') && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      disabled={
                        !units.data ||
                        (!product.specs.length && !!product.skus.length)
                      }
                      onClick={() => setAddSkus(true)}
                    >
                      {t('newSku')}
                    </Button>
                  )
                }
                notice={
                  product.status === 'DISABLED' && (
                    <Alert
                      className="mx-4 mb-3"
                      type="warning"
                      showIcon
                      title={t('productDisabled')}
                    />
                  )
                }
              />
            </section>
            <Collapse
              className={`${styles.panel} ${styles.specPanel}`}
              expandIconPlacement="end"
              expandIcon={({ isActive }) => (
                <DownOutlined rotate={isActive ? 180 : 0} aria-hidden="true" />
              )}
              items={[
                {
                  key: 'specs',
                  label: (
                    <span className="flex items-center gap-2 text-[19px] font-semibold">
                      {t('specs')}{' '}
                      <ProductCount>{product.specs.length}</ProductCount>
                    </span>
                  ),
                  children: (
                    <div className="grid gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={styles.muted}>{t('specChoiceHint')}</p>
                        {canEdit && (
                          <Button
                            icon={<PlusOutlined />}
                            disabled={!!product.skus.length}
                            onClick={() => setEditor({ type: 'spec' })}
                          >
                            {t('addSpec')}
                          </Button>
                        )}
                      </div>
                      {!!product.skus.length && (
                        <Alert type="info" title={t('specLocked')} />
                      )}
                      {!product.specs.length && (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={t('emptySpecs')}
                        />
                      )}
                      {product.specs.map((spec) => {
                        const unit = units.data?.find((item) =>
                          sameId(item.id, spec.unitId),
                        );
                        return (
                          <section
                            className={`grid gap-2 border-b py-3 last:border-b-0 ${styles.divider}`}
                            key={spec.id}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="m-0 flex items-center gap-2 text-[15px] font-semibold">
                                {spec.name}
                                <ProductCount>
                                  {t(
                                    spec.valueType === 'TEXT'
                                      ? 'textType'
                                      : 'numberType',
                                  )}
                                  {unit && ` · ${unit.name}`}
                                </ProductCount>
                              </h3>
                              {canEdit && (
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="text"
                                    onClick={() =>
                                      setEditor({ type: 'spec', spec })
                                    }
                                  >
                                    {t('editSpec')}
                                  </Button>
                                  <Button
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                      setEditor({ type: 'value', spec })
                                    }
                                  >
                                    {t('addValue')}
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {spec.values.map((value) => {
                                const label = String(
                                  value.textValue ?? value.numberValue,
                                );
                                const locked = specUsed(value);
                                return canEdit ? (
                                  <Button
                                    key={value.id}
                                    size="small"
                                    icon={locked ? <LockOutlined /> : undefined}
                                    iconPlacement="end"
                                    aria-label={`${t('editValue')} ${spec.name} ${label}`}
                                    onClick={() =>
                                      setEditor({ type: 'value', spec, value })
                                    }
                                  >
                                    {label}
                                  </Button>
                                ) : (
                                  <ProductCount key={value.id}>
                                    {label}
                                  </ProductCount>
                                );
                              })}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  ),
                },
              ]}
            />
          </div>
          {editor && (
            <EditModal
              editor={editor}
              product={product}
              categories={categories.data ?? []}
              units={units.data ?? []}
              onClose={() => {
                setEditor(undefined);
                void refresh();
              }}
              onSaved={refresh}
            />
          )}
          {addSkus && (
            <AddSkusModal
              product={product}
              units={units.data ?? []}
              onClose={() => {
                setAddSkus(false);
                void refresh();
              }}
              onSaved={refresh}
            />
          )}
        </>
      )}
    </ProductPage>
  );
}
