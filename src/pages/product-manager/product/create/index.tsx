import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { history, Link, useAccess } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
} from 'antd';
import { useRef, useState } from 'react';
import { createProduct } from '@/services/product/product';
import { useStyles } from '../../index.style';
import ProductPage from '../../ProductPage';
import {
  LoadError,
  ProductFields,
  ProductHeading,
  useProductCategories,
  useProductText,
  useProductUnits,
  useUnsavedChanges,
} from '../../shared';
import {
  buildDraftSpecs,
  type DraftSpec,
  draftCombinations,
  normalizeDecimal,
  normalizeSku,
  validDecimal,
} from '../../utils';
import ImageEditor from '../ImageEditor';
import SkuDraftRows from '../SkuDraftRows';

type CreateForm = Product.Values & {
  code: string;
  status: Product.Status;
  mode: 'single' | 'multiple';
  specs: DraftSpec[];
  skus: Product.SkuValues[];
};
type Combination = ReturnType<typeof draftCombinations>[number];
export default function CreateProduct() {
  const t = useProductText();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const client = useQueryClient();
  const { hasPermission } = useAccess();
  const categories = useProductCategories();
  const units = useProductUnits();
  const missingLookup =
    !hasPermission('product-manager:product-category:query') ||
    !hasPermission('product-manager:product-unit:query');
  const [form] = Form.useForm<CreateForm>();
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<Product.ImageDraft[]>([]);
  const [uploads, setUploads] = useState<Record<string, boolean>>({});
  const uploading = Object.values(uploads).some(Boolean);
  const setUploading = (key: string, busy: boolean) =>
    setUploads((previous) =>
      previous[key] === busy ? previous : { ...previous, [key]: busy },
    );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [selected, setSelected] = useState<React.Key[]>([]);
  const nextSpecKey = useRef(0);
  const allowNavigation = useUnsavedChanges(dirty);
  const mode = Form.useWatch('mode', form) ?? 'single';
  const drafts: DraftSpec[] = Form.useWatch('specs', form) ?? [];
  const newSku = (): Product.SkuValues => ({
    code: '',
    model: '',
    unitId: '',
    quantityScale: 0,
    status: 'ENABLED',
    sortOrder: 0,
    stockQuantity: '0',
  });
  const next = async () => {
    try {
      if (step === 0) {
        await form.validateFields([
          'name',
          'code',
          'categoryId',
          'brand',
          'sortOrder',
          'description',
          'status',
        ]);
        if (uploading) {
          message.info(t('uploading'));
          return;
        }
        setStep(1);
      } else if (step === 1) {
        if (mode === 'multiple')
          await form.validateFields([['specs']], {
            recursive: true,
          });
        const nextRows = draftCombinations(
          mode === 'multiple'
            ? buildDraftSpecs(form.getFieldValue('specs') ?? [])
            : [],
        );
        const previous = form.getFieldValue('skus') ?? [];
        form.setFieldValue(
          'skus',
          nextRows.map((row) => {
            const index = combinations.findIndex((old) => old.key === row.key);
            return index >= 0 ? previous[index] : newSku();
          }),
        );
        setCombinations(nextRows);
        setSelected(
          nextRows.length === 1
            ? [nextRows[0].key]
            : selected.filter((key) => nextRows.some((row) => row.key === key)),
        );
        setStep(2);
      } else {
        if (!selected.length) {
          message.error(t('skuRequired'));
          return;
        }
        const indexes = combinations.flatMap((row, index) =>
          selected.includes(row.key) ? [index] : [],
        );
        await form.validateFields(
          indexes.map((index) => ['skus', index]),
          {
            recursive: true,
          },
        );
        const values = form.getFieldsValue(true);
        const skus = indexes.map((index) => ({
          ...normalizeSku(values.skus[index]),
          selections: combinations[index].selections,
        }));
        if (new Set(skus.map((sku) => sku.code)).size !== skus.length) {
          message.error(t('duplicateCodes'));
          return;
        }
        setSaving(true);
        const result = await createProduct({
          name: values.name.trim(),
          code: values.code.trim(),
          categoryId: values.categoryId,
          brand: values.brand?.trim() || null,
          description: values.description?.trim() || null,
          sortOrder: values.sortOrder ?? 0,
          status: values.status,
          images: images.map(({ attachmentId, isCover }) => ({
            attachmentId,
            isCover,
          })),
          specs: mode === 'multiple' ? buildDraftSpecs(values.specs) : [],
          skus,
        });
        message.success(t('saved'));
        setDirty(false);
        allowNavigation();
        await client.invalidateQueries({
          queryKey: ['products'],
        });
        history.replace(
          `/product-manager/product/${encodeURIComponent(String(result.id))}`,
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'combinationLimit')
        message.error(t('combinationLimit'));
      // Form and request handlers present other validation failures; retain the draft.
    } finally {
      setSaving(false);
    }
  };
  const lookupFailed = categories.isError || units.isError;
  const missingCategory = categories.data?.length === 0;
  const missingUnit = units.data?.length === 0;
  return (
    <ProductPage
      label={t('create')}
      nested
      heading={
        <ProductHeading
          title={t('create')}
          subtitle={t('createSubtitle')}
          actions={
            <Button
              disabled={saving || uploading}
              icon={<CloseOutlined />}
              onClick={() => history.push('/product-manager/product')}
            >
              {t('cancelCreate')}
            </Button>
          }
        />
      }
      steps={
        <ol className={styles.steps} aria-label={t('createSteps')}>
          {(['newSteps.info', 'newSteps.specs', 'newSteps.skus'] as const).map(
            (key, index) => (
              <li
                key={key}
                className={styles.step}
                aria-current={index === step ? 'step' : undefined}
                data-complete={index < step}
              >
                <span aria-hidden="true">
                  {index < step ? <CheckOutlined /> : index + 1}
                </span>
                {t(key)}
              </li>
            ),
          )}
        </ol>
      }
    >
      {missingLookup ? (
        <Alert type="warning" showIcon title={t('lookupPermission')} />
      ) : lookupFailed ? (
        <LoadError
          retry={() => {
            if (categories.isError) void categories.refetch();
            if (units.isError) void units.refetch();
          }}
        />
      ) : (
        <>
          {(missingCategory || missingUnit) && (
            <Alert
              className="mb-5"
              type="info"
              showIcon
              title={t('missingSetup')}
              description={
                <Space wrap>
                  {missingCategory && (
                    <Link to="/product-manager/product-category">
                      {t('category.title')}
                    </Link>
                  )}
                  {missingUnit && (
                    <Link to="/product-manager/product-unit">
                      {t('unit.title')}
                    </Link>
                  )}
                </Space>
              }
            />
          )}
          <Form
            className={styles.form}
            form={form}
            layout="vertical"
            initialValues={{
              status: 'ENABLED',
              sortOrder: 0,
              mode: 'single',
              specs: [],
              skus: [],
            }}
            disabled={saving}
            onValuesChange={() => setDirty(true)}
          >
            <div
              hidden={step !== 0}
              className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
            >
              <section className={`${styles.panel} ${styles.content}`}>
                <h2 className="mb-4 text-[19px] font-semibold">{t('info')}</h2>
                <ProductFields categories={categories.data ?? []} />
              </section>
              <section className={`${styles.panel} ${styles.content}`}>
                <h2 className="mb-4 text-[19px] font-semibold">
                  {t('images')}
                </h2>
                <ImageEditor
                  value={images}
                  onChange={(value) => {
                    setImages(value);
                    setDirty(true);
                  }}
                  disabled={saving}
                  onUploadingChange={(busy) => setUploading('product', busy)}
                />
              </section>
            </div>
            <section
              hidden={step !== 1}
              className={`${styles.panel} ${styles.content}`}
            >
              <h2 className="mb-1 text-[19px] font-semibold">
                {t('newSteps.specs')}
              </h2>
              <p className={`mb-4 ${styles.muted}`}>{t('specModeHint')}</p>
              <Form.Item name="mode">
                <Radio.Group className="grid w-full gap-3 sm:grid-cols-2">
                  <Radio className={styles.modeOption} value="single">
                    <strong>{t('single')}</strong>
                    <br />
                    <small className={styles.muted}>{t('singleHint')}</small>
                  </Radio>
                  <Radio className={styles.modeOption} value="multiple">
                    <strong>{t('multiple')}</strong>
                    <br />
                    <small className={styles.muted}>{t('multiModeHint')}</small>
                  </Radio>
                </Radio.Group>
              </Form.Item>
              {mode === 'single' ? (
                <Alert type="info" title={t('singleHint')} />
              ) : (
                <Form.List
                  name="specs"
                  rules={[
                    {
                      validator: async (_, items: DraftSpec[]) => {
                        const names =
                          items?.map((item) => item?.name?.trim()) ?? [];
                        if (
                          !names.length ||
                          names.some((name) => !name) ||
                          new Set(names).size !== names.length
                        )
                          throw new Error(t('specsInvalid'));
                      },
                    },
                  ]}
                >
                  {(fields, { add, remove }, { errors }) => (
                    <>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="m-0 text-[15px] font-semibold">
                          {t('specDimensions')}
                        </h3>
                        <Button
                          icon={<PlusOutlined />}
                          onClick={() =>
                            add({
                              clientKey: `dimension-${nextSpecKey.current++}`,
                              name: '',
                              valueType: 'TEXT',
                              sortOrder: fields.length,
                              tokens: [],
                              values: [],
                            })
                          }
                        >
                          {t('addSpec')}
                        </Button>
                      </div>
                      {!fields.length && (
                        <p className={`my-5 text-center ${styles.muted}`}>
                          {t('emptySpecs')}
                        </p>
                      )}
                      {fields.map((field) => (
                        <section
                          key={field.key}
                          className={`border-b py-3 ${styles.divider}`}
                        >
                          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                            <Form.Item
                              name={[field.name, 'name']}
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
                            <Form.Item
                              name={[field.name, 'valueType']}
                              label={t('valueType')}
                            >
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
                                  form.setFieldValue(
                                    ['specs', field.name, 'tokens'],
                                    [],
                                  );
                                  form.setFieldValue(
                                    ['specs', field.name, 'unitId'],
                                    undefined,
                                  );
                                }}
                              />
                            </Form.Item>
                            {drafts[field.name]?.valueType === 'NUMBER' && (
                              <Form.Item
                                name={[field.name, 'unitId']}
                                label={t('specUnit')}
                              >
                                <Select
                                  allowClear
                                  placeholder={t('noUnit')}
                                  options={units.data?.map((unit) => ({
                                    value: String(unit.id),
                                    label: unit.name,
                                  }))}
                                />
                              </Form.Item>
                            )}
                            <Form.Item
                              name={[field.name, 'sortOrder']}
                              label={t('sortOrder')}
                            >
                              <InputNumber
                                min={-2147483648}
                                max={2147483647}
                                precision={0}
                              />
                            </Form.Item>
                            <Form.Item
                              className="col-span-full"
                              name={[field.name, 'tokens']}
                              label={t('values')}
                              extra={t('valuesHint')}
                              rules={[
                                {
                                  validator: async (_, tokens: string[]) => {
                                    const numeric =
                                      drafts[field.name]?.valueType ===
                                      'NUMBER';
                                    const normalized =
                                      tokens?.map((token) =>
                                        numeric
                                          ? normalizeDecimal(token)
                                          : token.trim(),
                                      ) ?? [];
                                    if (
                                      !normalized.length ||
                                      normalized.some(
                                        (value) =>
                                          !value ||
                                          (!numeric && value.length > 128),
                                      ) ||
                                      (numeric &&
                                        tokens.some(
                                          (value) =>
                                            !validDecimal(value, 6, true),
                                        )) ||
                                      new Set(normalized).size !==
                                        normalized.length
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
                          </div>
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          >
                            {t('removeSpec')}
                          </Button>
                        </section>
                      ))}
                      <Form.ErrorList errors={errors} />
                      <Alert
                        className="mt-3"
                        type="info"
                        title={t('previewHint')}
                      />
                    </>
                  )}
                </Form.List>
              )}
            </section>
            <section
              hidden={step !== 2}
              className={`${styles.panel} ${styles.content}`}
            >
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="m-0 text-[19px] font-semibold">
                    {t(mode === 'multiple' ? 'combinationSkus' : 'defaultSku')}
                  </h2>
                  <p className={styles.muted}>
                    {t('selectedOf', {
                      count: selected.length,
                      total: combinations.length,
                    })}
                  </p>
                </div>
                {mode === 'multiple' && (
                  <Space wrap>
                    <Button
                      type="text"
                      disabled={saving || uploading}
                      onClick={() =>
                        setSelected(combinations.map((row) => row.key))
                      }
                    >
                      {t('selectAll')}
                    </Button>
                    <Button
                      type="text"
                      disabled={saving || uploading}
                      onClick={() => setSelected([])}
                    >
                      {t('deselectAll')}
                    </Button>
                  </Space>
                )}
              </header>
              <SkuDraftRows
                rows={combinations}
                selected={selected}
                units={units.data ?? []}
                selectable={mode === 'multiple'}
                disabled={saving || uploading}
                onSelect={(keys) => {
                  setSelected(keys);
                  setDirty(true);
                }}
                onUploadingChange={setUploading}
              />
            </section>
          </Form>
          <div className="mt-7 flex justify-between gap-3">
            <div>
              {step > 0 && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  disabled={saving || uploading}
                  onClick={() => setStep(step - 1)}
                >
                  {t('previous')}
                </Button>
              )}
            </div>
            <Button
              type="primary"
              loading={saving}
              icon={step === 2 ? <CheckOutlined /> : <ArrowRightOutlined />}
              iconPlacement="end"
              disabled={
                uploading || !categories.data?.length || !units.data?.length
              }
              onClick={() => void next()}
            >
              {t(
                step === 2
                  ? 'saveProduct'
                  : step === 1 && mode === 'multiple'
                    ? 'preview'
                    : 'next',
              )}
            </Button>
          </div>
        </>
      )}
    </ProductPage>
  );
}
