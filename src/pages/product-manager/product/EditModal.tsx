import {
  Alert,
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from 'antd';
import { useState } from 'react';
import {
  createSpec,
  createSpecValue,
  deleteSpec,
  deleteSpecValue,
  getProduct,
  saveImages,
  saveSkuImages,
  updateProduct,
  updateSku,
  updateSpec,
  updateSpecValue,
} from '@/services/product/product';
import { useStyles } from '../index.style';
import {
  DecimalField,
  ProductFields,
  SkuFields,
  useProductText,
} from '../shared';
import { normalizeDecimal, sameId, skuPrices, validDecimal } from '../utils';
import ImageEditor from './ImageEditor';
export type ProductEdit =
  | {
      type: 'info';
    }
  | {
      type: 'images';
    }
  | {
      type: 'sku' | 'skuImages';
      sku: Product.Sku;
    }
  | {
      type: 'spec';
      spec?: Product.Spec;
    }
  | {
      type: 'value';
      spec: Product.Spec;
      value?: Product.SpecValue;
    };
type EditValues = Product.Values &
  Product.SkuValues &
  Product.SpecValueInput & {
    valueType: 'TEXT' | 'NUMBER';
    tokens: string[];
  };
export default function EditModal({
  editor,
  product,
  categories,
  units,
  onClose,
  onSaved,
}: {
  editor: ProductEdit;
  product: Product.Detail;
  categories: Product.Category[];
  units: Product.Unit[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const t = useProductText();
  const { styles } = useStyles();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<EditValues>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stale, setStale] = useState(false);
  const [images, setImages] = useState<Product.ImageDraft[]>(
    editor.type === 'skuImages' ? (editor.sku.images ?? []) : product.images,
  );
  const sku = 'sku' in editor ? editor.sku : undefined;
  const [baseline] = useState(sku?.version ?? product.version);
  const editingImages = editor.type === 'images' || editor.type === 'skuImages';
  const valueType = Form.useWatch('valueType', form) ?? 'TEXT';
  const used =
    editor.type === 'value' &&
    Boolean(
      editor.value &&
        product.skus.some((sku) =>
          sku.specValues.some((value) =>
            sameId(value.specValueId, editor.value?.id),
          ),
        ),
    );
  const titles = {
    info: 'editInfo',
    images: 'manageImages',
    skuImages: 'skuImages',
    sku: 'editSku',
    spec: editor.type === 'spec' && editor.spec ? 'editSpec' : 'addSpec',
    value: editor.type === 'value' && editor.value ? 'editValue' : 'addValue',
  } as const;
  const initialValues =
    editor.type === 'sku'
      ? {
          ...editor.sku,
          unitId: String(editor.sku.unitId),
        }
      : editor.type === 'info'
        ? {
            ...product,
            categoryId: String(product.categoryId),
          }
        : editor.type === 'spec'
          ? (editor.spec ?? {
              name: '',
              valueType: 'TEXT',
              sortOrder: 0,
              tokens: [],
            })
          : editor.type === 'value'
            ? (editor.value ?? {
                textValue: '',
                numberValue: '',
                sortOrder: 0,
              })
            : {};
  const finish = async (values: EditValues) => {
    setSaving(true);
    try {
      const expectedVersion = baseline;
      switch (editor.type) {
        case 'info':
          await updateProduct({
            id: product.id,
            expectedVersion,
            name: values.name.trim(),
            categoryId: values.categoryId,
            brand: values.brand?.trim() || null,
            description: values.description?.trim() || null,
            sortOrder: values.sortOrder ?? 0,
          });
          break;
        case 'images':
        case 'skuImages': {
          const payload = {
            id: editor.type === 'skuImages' ? editor.sku.id : product.id,
            expectedVersion,
            images: images.map(({ attachmentId, isCover }) => ({
              attachmentId,
              isCover,
            })),
          };
          await (editor.type === 'skuImages'
            ? saveSkuImages(payload)
            : saveImages(payload));
          break;
        }
        case 'sku':
          await updateSku({
            id: editor.sku.id,
            expectedVersion,
            model: values.model?.trim() || null,
            unitId: values.unitId,
            quantityScale: values.quantityScale,
            sortOrder: values.sortOrder ?? 0,
            ...skuPrices(values),
          });
          break;
        case 'spec':
          if (editor.spec)
            await updateSpec({
              id: editor.spec.id,
              expectedVersion,
              name: values.name.trim(),
              sortOrder: values.sortOrder ?? 0,
            });
          else
            await createSpec({
              productId: product.id,
              expectedVersion,
              name: values.name.trim(),
              valueType: values.valueType,
              unitId: values.valueType === 'NUMBER' ? values.unitId : undefined,
              sortOrder: values.sortOrder ?? 0,
              values: values.tokens.map((value, index) => ({
                sortOrder: index,
                ...(values.valueType === 'NUMBER'
                  ? {
                      numberValue: normalizeDecimal(value),
                    }
                  : {
                      textValue: value.trim(),
                    }),
              })),
            });
          break;
        case 'value': {
          const value = used
            ? {}
            : editor.spec.valueType === 'TEXT'
              ? {
                  textValue: values.textValue?.trim(),
                }
              : {
                  numberValue: values.numberValue,
                };
          if (editor.value)
            await updateSpecValue({
              id: editor.value.id,
              expectedVersion,
              sortOrder: values.sortOrder ?? 0,
              ...value,
            });
          else
            await createSpecValue({
              specId: editor.spec.id,
              expectedVersion,
              sortOrder: values.sortOrder ?? 0,
              ...value,
            });
          break;
        }
      }
      message.success(t('saved'));
      await onSaved();
      onClose();
    } catch {
      try {
        const latest = await getProduct(product.id);
        const version = sku
          ? latest.skus.find((item) => sameId(item.id, sku.id))?.version
          : latest.version;
        if (version !== baseline) setStale(true);
      } catch {
        /* Preserve input and version on read failure. */
      }
    } finally {
      setSaving(false);
    }
  };
  const valueUnit =
    editor.type === 'value'
      ? units.find((unit) => sameId(unit.id, editor.spec.unitId))
      : undefined;
  const removableSpec =
    editor.type === 'spec' && !product.skus.length ? editor.spec : undefined;
  const removableValue =
    editor.type === 'value' && !used ? editor.value : undefined;
  const remove = removableSpec || removableValue;
  return (
    <Modal
      open
      width={
        editor.type === 'info' || editor.type === 'sku' || editingImages
          ? 850
          : 560
      }
      title={t(titles[editor.type])}
      mask={{
        closable: false,
      }}
      confirmLoading={saving}
      okButtonProps={{
        disabled: uploading || stale,
      }}
      onCancel={() => {
        if (!saving && !uploading) onClose();
      }}
      onOk={() => form.submit()}
      okText={t(editingImages ? 'saveImages' : 'save')}
      footer={
        remove
          ? (buttons) => (
              <>
                <Button
                  danger
                  disabled={saving || stale}
                  onClick={() =>
                    modal.confirm({
                      title: removableSpec
                        ? t('removeSpecConfirm', { name: removableSpec.name })
                        : t('removeValueConfirm', {
                            name: String(
                              removableValue?.textValue ??
                                removableValue?.numberValue,
                            ),
                          }),
                      okButtonProps: { danger: true },
                      onOk: async () => {
                        const payload = {
                          id: remove.id,
                          expectedVersion: baseline,
                        };
                        await (removableSpec
                          ? deleteSpec(payload)
                          : deleteSpecValue(payload));
                        message.success(t('deleted'));
                        await onSaved();
                        onClose();
                      },
                    })
                  }
                >
                  {t('delete')}
                </Button>
                {buttons}
              </>
            )
          : undefined
      }
      cancelText={t('cancel')}
    >
      {stale && (
        <Alert className="mb-4" type="warning" showIcon title={t('stale')} />
      )}
      <Form
        className={styles.form}
        form={form}
        layout="vertical"
        initialValues={initialValues}
        disabled={saving || stale}
        onFinish={(values) => {
          if (!stale && !uploading) void finish(values);
        }}
      >
        {editor.type === 'info' && (
          <ProductFields categories={categories} editing />
        )}
        {editor.type === 'skuImages' && (
          <div className="mb-4">
            <strong>{editor.sku.code}</strong> · V{editor.sku.version}
            <p>{t('skuImageFallback')}</p>
          </div>
        )}
        {editingImages && (
          <ImageEditor
            owner={editor.type === 'skuImages' ? 'sku' : 'product'}
            value={images}
            onChange={setImages}
            disabled={saving || stale}
            onUploadingChange={setUploading}
          />
        )}
        {editor.type === 'sku' && (
          <>
            <Alert
              className="mb-4"
              type="info"
              title={`${t('currentStock')}: ${normalizeDecimal(editor.sku.stockQuantity)} ${editor.sku.unitName}`}
              description={t('stockHint')}
            />
            <SkuFields
              units={units}
              creating={false}
              unitLocked={normalizeDecimal(editor.sku.stockQuantity) !== '0'}
              currentStock={editor.sku.stockQuantity}
            />
          </>
        )}
        {editor.type === 'spec' && (
          <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
            <Form.Item
              name="name"
              label={t('specName')}
              rules={[
                {
                  required: true,
                  whitespace: true,
                },
              ]}
            >
              <Input maxLength={64} />
            </Form.Item>
            {editor.spec ? (
              <>
                <Form.Item label={t('valueType')}>
                  <Input
                    value={t(
                      editor.spec.valueType === 'NUMBER'
                        ? 'numberType'
                        : 'textType',
                    )}
                    disabled
                  />
                </Form.Item>
                {editor.spec.valueType === 'NUMBER' && (
                  <Form.Item label={t('specUnit')}>
                    <Input
                      value={
                        units.find((item) =>
                          sameId(item.id, editor.spec?.unitId),
                        )?.name ?? t('noUnit')
                      }
                      disabled
                    />
                  </Form.Item>
                )}
              </>
            ) : (
              <>
                <Form.Item name="valueType" label={t('valueType')}>
                  <Select
                    options={[
                      {
                        value: 'TEXT',
                        label: t('textType'),
                      },
                      {
                        value: 'NUMBER',
                        label: t('numberType'),
                      },
                    ]}
                    onChange={() => {
                      form.setFieldsValue({
                        tokens: [],
                        unitId: undefined,
                      });
                    }}
                  />
                </Form.Item>
                {valueType === 'NUMBER' && (
                  <Form.Item name="unitId" label={t('specUnit')}>
                    <Select
                      allowClear
                      placeholder={t('noUnit')}
                      options={units.map((unit) => ({
                        value: String(unit.id),
                        label: unit.name,
                      }))}
                    />
                  </Form.Item>
                )}
                <Form.Item
                  name="tokens"
                  className="col-span-full"
                  label={t('values')}
                  extra={t('valuesHint')}
                  rules={[
                    {
                      validator: async (_, tokens: string[]) => {
                        const values =
                          tokens?.map((token) =>
                            valueType === 'NUMBER'
                              ? normalizeDecimal(token)
                              : token.trim(),
                          ) ?? [];
                        if (
                          !values.length ||
                          new Set(values).size !== values.length ||
                          tokens.some((token) =>
                            valueType === 'NUMBER'
                              ? !validDecimal(token, 6, true)
                              : !token.trim() || token.trim().length > 128,
                          )
                        )
                          throw new Error(t('valuesInvalid'));
                      },
                    },
                  ]}
                >
                  <Select
                    mode="tags"
                    tokenSeparators={[',', '，', '、']}
                    open={false}
                  />
                </Form.Item>
              </>
            )}
            <Form.Item name="sortOrder" label={t('sortOrder')}>
              <InputNumber min={-2147483648} max={2147483647} precision={0} />
            </Form.Item>
          </div>
        )}
        {editor.type === 'value' && (
          <>
            <p className="mb-3 text-sm">
              {editor.spec.name} ·{' '}
              {t(
                editor.spec.valueType === 'NUMBER' ? 'numberType' : 'textType',
              )}
              {valueUnit && ` / ${valueUnit.name}`}
            </p>
            {used && (
              <Alert className="mb-4" type="info" title={t('valueUsed')} />
            )}
            {editor.spec.valueType === 'NUMBER' ? (
              <DecimalField
                name="numberValue"
                label={t('value')}
                signed
                required
                disabled={used}
              />
            ) : (
              <Form.Item
                name="textValue"
                label={t('value')}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                  },
                ]}
              >
                <Input maxLength={128} disabled={used} />
              </Form.Item>
            )}
          </>
        )}
        {editor.type === 'value' && (
          <Form.Item name="sortOrder" label={t('sortOrder')}>
            <InputNumber min={-2147483648} max={2147483647} precision={0} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
