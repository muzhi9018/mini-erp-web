import { Alert, App, Button, Form, Modal, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { getProduct, setStock } from '@/services/product/product';
import { useStyles } from '../index.style';
import { DecimalField, LoadError, useProductText } from '../shared';
import { normalizeDecimal, sameId } from '../utils';
export default function StockModal({
  productId,
  skuId,
  onClose,
  onSaved,
}: {
  productId: Product.Id;
  skuId: Product.Id;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const t = useProductText();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [form] = Form.useForm<{
    stockQuantity: Product.Decimal;
  }>();
  const [sku, setSku] = useState<Product.Sku>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [missing, setMissing] = useState(false);
  const load = async (initial: boolean) => {
    setLoading(true);
    setLoadError(false);
    try {
      const product = await getProduct(productId);
      const latest = product.skus.find((item) => sameId(item.id, skuId));
      if (!latest) {
        setMissing(true);
        return;
      }
      setSku(latest);
      setConflict(false);
      setReviewed(!initial);
      if (initial)
        form.setFieldValue('stockQuantity', String(latest.stockQuantity));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load(true);
  }, [skuId]);
  return (
    <Modal
      open
      title={t('setStock')}
      okText={t('saveStock')}
      cancelText={t('cancel')}
      confirmLoading={saving}
      okButtonProps={{
        disabled: loading || loadError || conflict || missing || !sku,
      }}
      mask={{
        closable: false,
      }}
      onCancel={() => {
        if (!saving) onClose();
      }}
      onOk={() => form.submit()}
    >
      <Spin spinning={loading}>
        {loadError ? (
          <LoadError retry={() => void load(!sku)} />
        ) : missing ? (
          <Alert type="warning" showIcon title={t('skuMissing')} />
        ) : (
          <>
            <div className="mb-4">
              <strong>{sku?.code ?? '—'}</strong>
              {sku?.specificationText && (
                <p className={styles.muted}>{sku.specificationText}</p>
              )}
            </div>
            {conflict && (
              <Alert
                className="mb-4"
                type="warning"
                showIcon
                title={t('stockConflict')}
                action={
                  <Button size="small" onClick={() => void load(false)}>
                    {t('reloadStock')}
                  </Button>
                }
              />
            )}
            {reviewed && (
              <Alert className="mb-4" type="info" title={t('stockReviewed')} />
            )}
            <Form
              className={styles.form}
              form={form}
              layout="vertical"
              disabled={saving || loading}
              onFinish={async (values) => {
                if (!sku || conflict) return;
                setSaving(true);
                try {
                  await setStock({
                    id: sku.id,
                    expectedVersion: sku.version,
                    stockQuantity: normalizeDecimal(values.stockQuantity),
                  });
                  message.success(t('saved'));
                  await onSaved();
                  onClose();
                } catch {
                  try {
                    const latest = (await getProduct(productId)).skus.find(
                      (item) => sameId(item.id, skuId),
                    );
                    if (!latest) setMissing(true);
                    else if (latest.version !== sku.version) {
                      setConflict(true);
                      setReviewed(false);
                    }
                  } catch {
                    /* Keep the original version and input; never retry a write automatically. */
                  }
                } finally {
                  setSaving(false);
                }
              }}
            >
              <div className="grid items-start gap-3 sm:grid-cols-2">
                <div className={`${styles.panel} p-3`}>
                  <div className={`mb-1 text-xs ${styles.muted}`}>
                    {t('currentStock')}
                    {sku && ` · SKU V${sku.version}`}
                  </div>
                  <div className="text-xl font-semibold tabular-nums">
                    {sku
                      ? `${normalizeDecimal(sku.stockQuantity)} ${sku.unitName}`
                      : '—'}
                  </div>
                </div>
                <DecimalField
                  name="stockQuantity"
                  label={`${t('targetStock')} (${sku?.unitName ?? ''})`}
                  scale={sku?.quantityScale ?? 0}
                  extra={t('quantityHint', { scale: sku?.quantityScale ?? 0 })}
                  required
                />
              </div>
            </Form>
            {!conflict && !reviewed && (
              <Alert type="info" title={t('stockAbsolute')} />
            )}
          </>
        )}
      </Spin>
    </Modal>
  );
}
