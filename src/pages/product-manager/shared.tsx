import { EllipsisOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { history, useAccess, useIntl } from '@umijs/max';
import {
  App,
  Button,
  Form,
  type FormInstance,
  Input,
  InputNumber,
  Modal,
  Result,
  Select,
  TreeSelect,
} from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import productCatalog from '@/locales/zh-CN/productCatalog';
import productCategory from '@/locales/zh-CN/productCategory';
import productUnit from '@/locales/zh-CN/productUnit';
import { listCategories } from '@/services/product/category';
import { listUnits } from '@/services/product/unit';
import { useStyles } from './index.style';
import { categoryOptions, validDecimal } from './utils';

const messages = {
  ...productCatalog,
  ...productCategory,
  ...productUnit,
};
type ShortKey<T> = T extends `product.${infer K}` ? K : never;
export function useProductText() {
  const intl = useIntl();
  return (
    key: ShortKey<keyof typeof messages>,
    values?: Record<string, string | number>,
  ) =>
    intl.formatMessage(
      {
        id: `product.${key}`,
        defaultMessage: messages[`product.${key}`],
      },
      values,
    );
}
export function useProductCategories() {
  const { hasPermission } = useAccess();
  return useQuery({
    queryKey: ['productCategories'],
    queryFn: listCategories,
    enabled: hasPermission('product-manager:product-category:query'),
  });
}

export function useProductUnits() {
  const { hasPermission } = useAccess();
  return useQuery({
    queryKey: ['productUnits'],
    queryFn: listUnits,
    enabled: hasPermission('product-manager:product-unit:query'),
  });
}

export function useRefreshProduct(id: Product.Id) {
  const client = useQueryClient();
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['productDetail', String(id)] }),
      client.invalidateQueries({ queryKey: ['productSkus', String(id)] }),
      client.invalidateQueries({ queryKey: ['products'] }),
    ]);
  };
}
export function useUnsavedChanges(dirty: boolean) {
  const t = useProductText();
  const { modal } = App.useApp();
  const unblock = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    if (!dirty) return;
    unblock.current = history.block(({ retry }) => {
      modal.confirm({
        title: t('leaveTitle'),
        content: t('leaveDescription'),
        okText: t('confirm'),
        cancelText: t('cancel'),
        onOk: () => {
          unblock.current?.();
          retry();
        },
      });
    });
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      unblock.current?.();
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [dirty]);
  return () => unblock.current?.();
}
export function ProductHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { styles } = useStyles();
  return (
    <div className={styles.heading}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && (
          <p className={`mt-1 text-[13px] ${styles.muted}`}>{subtitle}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
export function ProductCount({ children }: { children: ReactNode }) {
  const { styles } = useStyles();
  return <span className={styles.badge}>{children}</span>;
}
export function MoreProductActions({
  label,
  title,
  code,
  children,
}: {
  label: string;
  title: string;
  code: string;
  children: (close: () => void) => ReactNode;
}) {
  const t = useProductText();
  const { styles } = useStyles();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button
        icon={<EllipsisOutlined />}
        aria-label={label}
        onClick={() => setOpen(true)}
      />
      {open && (
        <Modal
          open
          title={title}
          onCancel={close}
          footer={<Button onClick={close}>{t('close')}</Button>}
        >
          <p className={`mb-3 ${styles.mono}`}>{code}</p>
          <div className="flex flex-wrap gap-2">{children(close)}</div>
        </Modal>
      )}
    </>
  );
}
export function StatusTag({ status }: { status: Product.Status }) {
  const t = useProductText();
  const { styles } = useStyles();
  return (
    <span
      className={`${styles.badge} ${styles.status}`}
      data-enabled={status === 'ENABLED'}
    >
      {t(status === 'ENABLED' ? 'enabled' : 'disabled')}
    </span>
  );
}
export function LoadError({ retry }: { retry: () => void }) {
  const t = useProductText();
  return (
    <Result
      status="error"
      title={t('loadError')}
      extra={<Button onClick={retry}>{t('retry')}</Button>}
    />
  );
}
export function ProductFields({
  categories,
  editing = false,
}: {
  categories: Product.Category[];
  editing?: boolean;
}) {
  const t = useProductText();
  return (
    <div className="grid grid-cols-1 gap-x-[13px] sm:grid-cols-2 [&>.ant-form-item:last-child]:mb-0">
      <Form.Item
        name="name"
        label={t('name')}
        rules={[
          {
            required: true,
            whitespace: true,
          },
        ]}
      >
        <Input maxLength={256} placeholder={t('namePlaceholder')} />
      </Form.Item>
      <Form.Item
        name="code"
        label={t('code')}
        rules={
          editing
            ? []
            : [
                {
                  required: true,
                  whitespace: true,
                },
              ]
        }
        extra={editing ? t('codeFixed') : undefined}
      >
        <Input
          maxLength={64}
          disabled={editing}
          placeholder={editing ? undefined : t('codePlaceholder')}
        />
      </Form.Item>
      <Form.Item
        name="categoryId"
        label={t('category')}
        rules={[
          {
            required: true,
          },
        ]}
        extra={t('categoryHint')}
      >
        <TreeSelect
          placeholder={t('chooseCategory')}
          treeData={categoryOptions(categories)}
          showSearch={{
            treeNodeFilterProp: 'title',
          }}
          treeDefaultExpandAll
        />
      </Form.Item>
      <Form.Item name="brand" label={t('brand')}>
        <Input maxLength={128} placeholder={t('optional')} />
      </Form.Item>
      {!editing && (
        <Form.Item
          name="status"
          label={t('productStatus')}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
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
      )}
      <Form.Item name="sortOrder" label={t('sortOrder')}>
        <InputNumber
          min={-2147483648}
          max={2147483647}
          precision={0}
          className="w-full"
        />
      </Form.Item>
      <Form.Item
        className="col-span-full"
        name="description"
        label={t('description')}
      >
        <Input.TextArea rows={3} maxLength={2048} placeholder={t('optional')} />
      </Form.Item>
    </div>
  );
}
export function DecimalField({
  name,
  label,
  scale = 6,
  signed = false,
  required = false,
  disabled = false,
  dependencies,
  extra,
  onChange,
}: {
  name: NamePath;
  label: string;
  scale?: number | ((form: Pick<FormInstance, 'getFieldValue'>) => number);
  signed?: boolean;
  required?: boolean;
  disabled?: boolean;
  dependencies?: NamePath[];
  extra?: ReactNode;
  onChange?: (value: string) => void;
}) {
  const t = useProductText();
  return (
    <Form.Item
      name={name}
      label={label}
      dependencies={dependencies}
      extra={extra}
      rules={[
        {
          required,
        },
        (form) => ({
          validator: async (_, value) => {
            if ((value == null || value === '') && !required) return;
            const maxScale = typeof scale === 'function' ? scale(form) : scale;
            if (!validDecimal(value, maxScale, signed))
              throw new Error(
                t(signed ? 'signedDecimalInvalid' : 'decimalInvalid', {
                  scale: maxScale,
                }),
              );
          },
        }),
      ]}
    >
      <Input
        inputMode={scale === 0 ? 'numeric' : 'decimal'}
        disabled={disabled}
        autoComplete="off"
        onChange={(event) => onChange?.(event.target.value)}
      />
    </Form.Item>
  );
}

function SkuPriceFields({
  prefix,
  kind,
}: {
  prefix: (string | number)[];
  kind: 'Purchase' | 'Sale';
}) {
  const t = useProductText();
  const form = Form.useFormInstance();
  const { styles } = useStyles();
  const price = [...prefix, `reference${kind}Price`];
  const currency = [...prefix, `reference${kind}Currency`];
  const amountLabel = t(kind === 'Purchase' ? 'purchasePrice' : 'salePrice');
  return (
    <fieldset className={styles.priceGroup}>
      <legend>{amountLabel}</legend>
      <div className="grid grid-cols-2 gap-x-3">
        <DecimalField
          name={price}
          label={t(kind === 'Purchase' ? 'purchaseAmount' : 'saleAmount')}
          onChange={(value) => {
            if (!value.trim()) form.setFieldValue(currency, undefined);
          }}
        />
        <Form.Item
          name={currency}
          label={t(kind === 'Purchase' ? 'purchaseCurrency' : 'saleCurrency')}
          dependencies={[price]}
          rules={[
            ({ getFieldValue }) => ({
              validator: async (_, value) => {
                const hasPrice =
                  String(getFieldValue(price) ?? '').trim() !== '';
                if (hasPrice !== Boolean(value))
                  throw new Error(t('pricePair'));
              },
            }),
          ]}
        >
          <Select
            allowClear
            options={[
              { value: 'CNY', label: t('currencyCny') },
              { value: 'TWD', label: t('currencyTwd') },
            ]}
          />
        </Form.Item>
      </div>
      <Button
        type="text"
        size="small"
        onClick={() => {
          form.setFieldValue(price, undefined);
          form.setFieldValue(currency, undefined);
        }}
      >
        {t(kind === 'Purchase' ? 'clearPurchase' : 'clearSale')}
      </Button>
    </fieldset>
  );
}

export function SkuFields({
  prefix = [],
  units,
  creating = true,
  unitLocked = false,
  currentStock,
}: {
  prefix?: (string | number)[];
  units: Product.Unit[];
  creating?: boolean;
  unitLocked?: boolean;
  currentStock?: Product.Decimal;
}) {
  const t = useProductText();
  const scalePath = [...prefix, 'quantityScale'];
  const quantityScale = Form.useWatch(scalePath) ?? 0;
  return (
    <div
      className={
        creating
          ? 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,145px),1fr))] gap-x-3'
          : 'grid grid-cols-1 gap-x-4 sm:grid-cols-2'
      }
    >
      <Form.Item
        name={[...prefix, 'code']}
        label={t('skuCode')}
        rules={
          creating
            ? [
                {
                  required: true,
                  whitespace: true,
                },
              ]
            : []
        }
      >
        <Input maxLength={64} disabled={!creating} />
      </Form.Item>
      <Form.Item
        name={[...prefix, 'unitId']}
        label={t('unit')}
        rules={[
          {
            required: true,
          },
        ]}
        extra={unitLocked ? t('skuUnitLocked') : undefined}
      >
        <Select
          disabled={unitLocked}
          showSearch={{
            optionFilterProp: 'label',
          }}
          options={units.map((item) => ({
            value: String(item.id),
            label: item.name,
          }))}
        />
      </Form.Item>
      <Form.Item
        name={scalePath}
        label={t('quantityScale')}
        initialValue={0}
        extra={t('quantityHint', { scale: quantityScale })}
        rules={[
          {
            validator: async (_, scale) => {
              if (!Number.isInteger(scale) || scale < 0 || scale > 6)
                throw new Error(t('quantityScaleInvalid'));
              if (currentStock != null && !validDecimal(currentStock, scale))
                throw new Error(t('quantityScaleStock'));
            },
          },
        ]}
      >
        <Select
          options={Array.from({ length: 7 }, (_, value) => ({
            value,
            label: value,
          }))}
        />
      </Form.Item>
      {creating && (
        <DecimalField
          name={[...prefix, 'stockQuantity']}
          label={t('initialStock')}
          scale={(form) => form.getFieldValue(scalePath) ?? 0}
          extra={t('initialStockDefault')}
          dependencies={[scalePath]}
        />
      )}
      <Form.Item name={[...prefix, 'model']} label={t('model')}>
        <Input maxLength={128} />
      </Form.Item>
      {creating && (
        <Form.Item
          name={[...prefix, 'status']}
          label={t('status')}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
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
      )}
      <Form.Item name={[...prefix, 'sortOrder']} label={t('sortOrder')}>
        <InputNumber min={-2147483648} max={2147483647} precision={0} />
      </Form.Item>
      <div className="col-span-full grid gap-3 sm:grid-cols-2">
        <SkuPriceFields prefix={prefix} kind="Purchase" />
        <SkuPriceFields prefix={prefix} kind="Sale" />
      </div>
    </div>
  );
}
