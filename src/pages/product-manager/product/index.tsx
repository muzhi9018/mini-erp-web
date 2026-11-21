import {
  DownOutlined,
  LeftOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useQueries, useQuery } from '@tanstack/react-query';
import { history, useAccess, useLocation } from '@umijs/max';
import { Button, Empty, Image, Input, Select, Table, TreeSelect } from 'antd';
import dayjs from 'dayjs';
import { type Key, useEffect, useState } from 'react';
import { listProducts } from '@/services/product/product';
import { useStyles } from '../index.style';
import ProductPage from '../ProductPage';
import {
  LoadError,
  ProductHeading,
  StatusTag,
  useProductCategories,
  useProductText,
} from '../shared';
import { categoryOptions, flattenCategories, sameId } from '../utils';
import { InlineSkuTable } from './SkuTable';

const expandColumnWidth = 45;
const statuses = [undefined, 'ENABLED', 'DISABLED'] as const;

export default function ProductCatalog() {
  const t = useProductText();
  const { styles } = useStyles();
  const location = useLocation();
  const { hasPermission } = useAccess();
  const categories = useProductCategories();
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Product.Status>();
  const [categoryId, setCategoryId] = useState<string | undefined>(
    new URLSearchParams(location.search).get('categoryId') || undefined,
  );
  const [page, setPage] = useState({
    pageNum: 1,
    pageSize: 6,
  });
  const [expandedRows, setExpandedRows] = useState<readonly Key[]>([]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(keyword.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [keyword]);
  const counts = useQueries({
    queries: statuses.map((status) => {
      const params = { pageNum: 1, pageSize: 1, status };
      return {
        queryKey: ['products', params],
        queryFn: () => listProducts(params),
        staleTime: 60_000,
      };
    }),
  });
  const reset = () => {
    setKeyword('');
    setSearch('');
    setCategoryId(undefined);
    setStatus(undefined);
    setPage((previous) => ({ ...previous, pageNum: 1 }));
  };
  const params: Product.Query = {
    ...page,
    keyword: search || undefined,
    categoryId,
    status,
  };
  const query = useQuery({
    queryKey: ['products', params],
    queryFn: () => listProducts(params),
  });
  const flat = flattenCategories(categories.data ?? []);
  const open = (id: Product.Id) =>
    history.push(`/product-manager/product/${encodeURIComponent(String(id))}`);
  return (
    <ProductPage
      label={t('title')}
      heading={
        <ProductHeading
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            hasPermission('product-manager:product:create') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => history.push('/product-manager/product/create')}
              >
                {t('create')}
              </Button>
            )
          }
        />
      }
    >
      <div className={styles.panel}>
        <fieldset
          className="m-0 flex flex-wrap gap-1 border-0 px-4 pt-3"
          aria-label={t('status')}
        >
          {statuses.map((value, index) => (
            <Button
              className={styles.statusFilter}
              key={value ?? 'all'}
              type="text"
              aria-pressed={value === status}
              onClick={() => {
                setStatus(value);
                setPage((previous) => ({ ...previous, pageNum: 1 }));
              }}
            >
              {t(
                value === 'ENABLED'
                  ? 'enabledFilter'
                  : value === 'DISABLED'
                    ? 'disabledFilter'
                    : 'all',
              )}
              {counts[index].data && (
                <span className="text-xs tabular-nums">
                  {counts[index].data.total}
                </span>
              )}
            </Button>
          ))}
        </fieldset>
        <div className={styles.filters}>
          <div className="flex flex-wrap items-center gap-2.5">
            <Input
              className="w-full sm:max-w-[335px]"
              prefix={<SearchOutlined />}
              value={keyword}
              placeholder={t('search')}
              aria-label={t('search')}
              allowClear
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage((previous) => ({ ...previous, pageNum: 1 }));
              }}
              onPressEnter={() => setSearch(keyword.trim())}
            />
            {hasPermission('product-manager:product-category:query') && (
              <TreeSelect
                className="w-full sm:w-52"
                placeholder={t('allCategories')}
                aria-label={t('category')}
                allowClear
                showSearch={{
                  treeNodeFilterProp: 'title',
                }}
                treeDefaultExpandAll
                treeData={categoryOptions(categories.data ?? [])}
                value={categoryId}
                onChange={(value) => {
                  setCategoryId(value);
                  setPage({
                    ...page,
                    pageNum: 1,
                  });
                }}
              />
            )}
            <Button type="text" icon={<ReloadOutlined />} onClick={reset}>
              {t('reset')}
            </Button>
          </div>
        </div>
        {query.isError && !query.data ? (
          <LoadError retry={() => void query.refetch()} />
        ) : (
          <Table<Product.Item>
            rowKey={(product) => String(product.id)}
            rowClassName={(product) =>
              expandedRows.includes(String(product.id))
                ? styles.expandedProduct
                : ''
            }
            className={`${styles.table} ${styles.catalogTable}`}
            size="medium"
            loading={query.isFetching}
            dataSource={query.data?.records}
            scroll={{
              x: 900,
            }}
            expandable={{
              columnWidth: expandColumnWidth,
              expandedRowKeys: expandedRows,
              onExpandedRowsChange: setExpandedRows,
              rowExpandable: (product) => product.skuCount > 0,
              expandedRowClassName: styles.expandedSkuRow,
              expandIcon: ({ expanded, expandable, onExpand, record }) =>
                expandable && (
                  <Button
                    type="text"
                    size="small"
                    className={styles.statusFilter}
                    icon={expanded ? <DownOutlined /> : <RightOutlined />}
                    aria-expanded={expanded}
                    aria-label={t(expanded ? 'collapseSkus' : 'expandSkus', {
                      name: record.name,
                    })}
                    onClick={(event) => onExpand(record, event)}
                  />
                ),
              expandedRowRender: (product, _index, _indent, expanded) =>
                expanded && (
                  <div style={{ marginInlineStart: expandColumnWidth }}>
                    <InlineSkuTable product={product} />
                  </div>
                ),
            }}
            pagination={false}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('emptyCatalog')}
                >
                  <Button type="text" onClick={reset}>
                    {t('reset')}
                  </Button>
                </Empty>
              ),
            }}
            columns={[
              Table.EXPAND_COLUMN,
              {
                title: t('productIdentity'),
                key: 'product',
                width: '24%',
                render: (_, product) => (
                  <div className="flex items-center gap-3">
                    <div className={styles.thumbnail}>
                      {product.coverImageUrl ? (
                        <Image
                          src={product.coverImageUrl}
                          alt={product.name}
                          width={42}
                          height={42}
                        />
                      ) : (
                        <PictureOutlined />
                      )}
                    </div>
                    <div className="min-w-0 wrap-anywhere">
                      <Button
                        type="link"
                        className={styles.productName}
                        style={{
                          padding: 0,
                          height: 'auto',
                          maxWidth: '100%',
                          whiteSpace: 'normal',
                          textAlign: 'start',
                        }}
                        onClick={() => open(product.id)}
                      >
                        {product.name}
                      </Button>
                      <div className={styles.mono}>{product.code}</div>
                    </div>
                  </div>
                ),
              },
              {
                title: t('category'),
                dataIndex: 'categoryName',
                width: '26%',
                render: (name, product) =>
                  flat.find((item) =>
                    sameId(item.category.id, product.categoryId),
                  )?.path ??
                  name ??
                  '—',
              },
              {
                title: t('skuCount'),
                dataIndex: 'skuCount',
                width: '8%',
              },
              {
                title: t('status'),
                dataIndex: 'status',
                render: (value) => <StatusTag status={value} />,
                width: '9.5%',
              },
              {
                title: t('updatedAt'),
                dataIndex: 'gmtModified',
                render: (value) => (
                  <span className={styles.muted}>
                    {value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '—'}
                  </span>
                ),
                width: '18%',
              },
              {
                title: t('actions'),
                key: 'actions',
                align: 'right',

                render: (_, product) => (
                  <Button
                    type="link"
                    className={styles.rowAction}
                    size="small"
                    icon={<RightOutlined />}
                    iconPlacement="end"
                    onClick={() => open(product.id)}
                  >
                    {t('view')}
                  </Button>
                ),
              },
            ]}
          />
        )}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs ${styles.muted}`}
        >
          <span role="status">
            {t('total', { total: query.data?.total ?? 0 })}
            {!!query.data?.records.length &&
              ` · ${(page.pageNum - 1) * page.pageSize + 1}–${(page.pageNum - 1) * page.pageSize + query.data.records.length}`}
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={page.pageSize}
              aria-label={t('pageSize')}
              options={[6, 10, 20].map((value) => ({
                value,
                label: t('pageSizeOption', { count: value }),
              }))}
              onChange={(pageSize) => setPage({ pageNum: 1, pageSize })}
            />
            <Button
              icon={<LeftOutlined />}
              aria-label={t('previousPage')}
              disabled={page.pageNum === 1}
              onClick={() => setPage({ ...page, pageNum: page.pageNum - 1 })}
            />
            <span className="tabular-nums">
              {page.pageNum} /{' '}
              {Math.max(1, Math.ceil((query.data?.total ?? 0) / page.pageSize))}
            </span>
            <Button
              icon={<RightOutlined />}
              aria-label={t('nextPage')}
              disabled={
                page.pageNum * page.pageSize >= (query.data?.total ?? 0)
              }
              onClick={() => setPage({ ...page, pageNum: page.pageNum + 1 })}
            />
          </div>
        </div>
      </div>
    </ProductPage>
  );
}
