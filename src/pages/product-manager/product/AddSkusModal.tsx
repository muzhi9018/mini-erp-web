import { Alert, App, Button, Checkbox, Empty, Form, Modal } from 'antd';
import { useState } from 'react';
import {
  createSkus,
  getProduct,
  previewSkus,
} from '@/services/product/product';
import { useStyles } from '../index.style';
import { useProductText } from '../shared';
import { combinationKey, normalizeSku, sameId } from '../utils';
import SkuDraftRows from './SkuDraftRows';
export default function AddSkusModal({
  product,
  units,
  onClose,
  onSaved,
}: {
  product: Product.Detail;
  units: Product.Unit[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const t = useProductText();
  const { styles } = useStyles();
  const [previewed, setPreviewed] = useState(false);
  const { message } = App.useApp();
  const [form] = Form.useForm<{
    skus: Product.SkuValues[];
  }>();
  const [dimensions, setDimensions] = useState(
    product.specs.map((spec) => ({
      specId: spec.id,
      specValueIds: spec.values.map((value) => value.id),
    })),
  );
  const [rows, setRows] = useState<
    {
      key: string;
      label: string;
      selections: Product.Selection[];
    }[]
  >([]);
  const [selected, setSelected] = useState<React.Key[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<Record<string, boolean>>({});
  const uploading = Object.values(uploads).some(Boolean);
  const setUploading = (key: string, busy: boolean) =>
    setUploads((previous) =>
      previous[key] === busy ? previous : { ...previous, [key]: busy },
    );
  const [stale, setStale] = useState(false);
  const [version] = useState(product.version);
  const preview = async () => {
    if (dimensions.some((dimension) => !dimension.specValueIds.length)) {
      message.error(t('valuesInvalid'));
      return;
    }
    if (
      dimensions.reduce(
        (count, dimension) => count * dimension.specValueIds.length,
        1,
      ) > 1000
    ) {
      message.error(t('combinationLimit'));
      return;
    }
    setBusy(true);
    try {
      const combinations = product.specs.length
        ? await previewSkus(product.id, dimensions)
        : [[]];
      const existing = new Set(
        product.skus.map((sku) => combinationKey(sku.specValues)),
      );
      const next = combinations
        .filter((items) => !existing.has(combinationKey(items)))
        .map((items) => ({
          key: combinationKey(items) || 'default',
          selections: items,
          label:
            items
              .map((selection) => {
                const spec = product.specs.find((item) =>
                  sameId(item.id, selection.specId),
                );
                const value = spec?.values.find((item) =>
                  sameId(item.id, selection.specValueId),
                );
                const unit = units.find((item) =>
                  sameId(item.id, spec?.unitId),
                );
                return `${spec?.name}: ${value?.textValue ?? value?.numberValue}${unit ? ` ${unit.name}` : ''}`;
              })
              .join(' · ') || t('defaultSpec'),
        }));
      const oldValues = form.getFieldValue('skus') ?? [];
      form.setFieldValue(
        'skus',
        next.map((row) => {
          const index = rows.findIndex((item) => item.key === row.key);
          return index >= 0
            ? oldValues[index]
            : {
                code: '',
                unitId: '',
                quantityScale: 0,
                stockQuantity: '0',
                status: 'ENABLED',
                sortOrder: 0,
              };
        }),
      );
      setRows(next);
      setPreviewed(true);
      setSelected(
        next.length === 1
          ? [next[0].key]
          : selected.filter((key) => next.some((row) => row.key === key)),
      );
      if (!next.length) message.info(t('noNewCombinations'));
    } catch {
      /* Global request handler reports failures. */
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      width={850}
      title={t('newSku')}
      confirmLoading={busy}
      okButtonProps={{
        disabled: stale || uploading || (previewed && !selected.length),
      }}
      okText={t(previewed ? 'saveSelected' : 'preview')}
      cancelText={t('cancel')}
      mask={{
        closable: false,
      }}
      onCancel={() => {
        if (!busy && !uploading) onClose();
      }}
      onOk={() => {
        if (previewed) form.submit();
        else void preview();
      }}
    >
      {stale && <Alert className="mb-4" type="warning" title={t('stale')} />}
      {!previewed ? (
        <div>
          <p className={`mb-3 ${styles.muted}`}>
            {t(product.specs.length ? 'batchHint' : 'singleHint')}
          </p>
          {product.specs.map((spec, index) => {
            const unit = units.find((item) => sameId(item.id, spec.unitId));
            return (
              <section
                key={spec.id}
                className={`border-b py-3 last:border-b-0 ${styles.divider}`}
              >
                <h3 className="mb-2 text-[15px] font-semibold">
                  {spec.name}
                  {unit && ` · ${unit.name}`}
                </h3>
                <Checkbox.Group
                  className="flex flex-wrap gap-2"
                  disabled={busy}
                  value={dimensions[index].specValueIds}
                  options={spec.values.map((value) => ({
                    value: value.id,
                    label: String(value.textValue ?? value.numberValue),
                  }))}
                  onChange={(values) =>
                    setDimensions((previous) =>
                      previous.map((item, itemIndex) =>
                        index === itemIndex
                          ? { ...item, specValueIds: values }
                          : item,
                      ),
                    )
                  }
                />
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={styles.muted}>
            {t('selectedOf', { count: selected.length, total: rows.length })}
          </span>
          <Button
            type="text"
            disabled={busy || uploading}
            onClick={() => setPreviewed(false)}
          >
            {t('backToValues')}
          </Button>
        </div>
      )}
      {previewed && !rows.length && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('noNewCombinations')}
        />
      )}
      <Form
        className={styles.form}
        form={form}
        layout="vertical"
        hidden={!previewed}
        disabled={busy || stale}
        onFinish={async (values) => {
          if (!previewed || !selected.length || stale || uploading) return;
          const indexes = rows.flatMap((row, index) =>
            selected.includes(row.key) ? [index] : [],
          );
          const skus = indexes.map((index) => ({
            ...normalizeSku(values.skus[index]),
            specValues: rows[index].selections.map(
              ({ specId, specValueId }) => ({
                specId,
                specValueId,
              }),
            ),
          }));
          if (new Set(skus.map((sku) => sku.code)).size !== skus.length) {
            message.error(t('duplicateCodes'));
            return;
          }
          setBusy(true);
          try {
            await createSkus({
              id: product.id,
              expectedVersion: version,
              skus,
            });
            message.success(t('saved'));
            await onSaved();
            onClose();
          } catch {
            try {
              if ((await getProduct(product.id)).version !== version)
                setStale(true);
            } catch {
              /* Keep original version. */
            }
          } finally {
            setBusy(false);
          }
        }}
      >
        <SkuDraftRows
          rows={rows}
          selected={selected}
          units={units}
          selectable={!!product.specs.length}
          disabled={busy || stale || uploading}
          onSelect={setSelected}
          onUploadingChange={setUploading}
        />
      </Form>
    </Modal>
  );
}
