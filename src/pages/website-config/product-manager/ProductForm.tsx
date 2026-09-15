import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  InfoCircleFilled,
  PictureOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { PageContainer, ProFormSelect } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Button,
  Card,
  Collapse,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  message,
  Select,
  Spin,
  Steps,
  Switch,
  Upload,
} from 'antd';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  addProductI18n,
  createProduct,
  uploadProductImage,
} from '@/services/website/product';
import { listCategories } from '@/services/website/productCategory';
import { categoryLanguages } from '../category-manager/CategoryForm';
import { type ProductFormValues, toProductTranslation } from './formValues';
import { useStyles } from './index.style';

const useText = () => {
  const intl = useIntl();
  return (
    key: string,
    defaultMessage: string,
    values?: Record<string, string | number>,
  ) =>
    intl.formatMessage({ id: `productManager.${key}`, defaultMessage }, values);
};

type FieldName = string | (string | number)[];

type FieldProps = {
  name: FieldName;
  label: string;
  required?: boolean;
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
};

function TextField({
  name,
  label,
  required,
  multiline,
  maxLength,
  placeholder,
}: FieldProps) {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={[{ required, whitespace: true }]}
    >
      {multiline ? (
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 6 }}
          maxLength={maxLength}
          placeholder={placeholder}
          showCount={Boolean(maxLength)}
        />
      ) : (
        <Input maxLength={maxLength} placeholder={placeholder} />
      )}
    </Form.Item>
  );
}

function ProductImageUpload({
  value,
  onChange,
  label,
  disabled,
  showError,
}: {
  value?: string;
  onChange?: (url?: string) => void;
  label: string;
  disabled?: boolean;
  showError: (content: string) => void;
}) {
  const t = useText();
  const { styles } = useStyles();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    if (!value) {
      setFileList((current) =>
        current.some(({ status }) => status === 'uploading') ? current : [],
      );
      return;
    }
    setFileList([
      {
        uid: `uploaded-${value}`,
        name: label,
        status: 'done',
        url: value,
      },
    ]);
  }, [label, value]);

  const beforeUpload = (file: RcFile) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showError(t('uploadTypeError', '仅支持 JPG、PNG 格式的图片'));
      return Upload.LIST_IGNORE;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError(t('uploadSizeError', '图片大小不能超过 5 MB'));
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const customRequest: UploadProps['customRequest'] = async ({
    file,
    onError,
    onSuccess,
  }) => {
    try {
      const uploaded = await uploadProductImage(file as File);
      if (!uploaded.url)
        throw new Error(t('uploadResponseError', '上传接口未返回图片地址'));
      onChange?.(uploaded.url);
      onSuccess?.(uploaded);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };

  return (
    <div className={styles.imageUpload}>
      <Upload
        accept="image/jpeg,image/png"
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        disabled={disabled}
        fileList={fileList}
        listType="picture-card"
        maxCount={1}
        onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
        onPreview={(file) => setPreviewImage(file.url ?? file.thumbUrl ?? '')}
        onRemove={() => {
          onChange?.(undefined);
          setFileList([]);
        }}
      >
        {fileList.length ? null : (
          <button
            type="button"
            className={styles.uploadButton}
            aria-label={t(
              'uploadImageLabel',
              label.startsWith('上传') ? label : `上传${label}`,
            )}
          >
            {fileList.some(({ status }) => status === 'uploading') ? (
              <Spin size="small" />
            ) : (
              <PictureOutlined />
            )}
            <span>{t('uploadImage', '点击上传')}</span>
          </button>
        )}
      </Upload>
      {previewImage && (
        <Image
          alt={label}
          src={previewImage}
          styles={{ root: { display: 'none' } }}
          preview={{
            open: true,
            onOpenChange: (open) => !open && setPreviewImage(''),
          }}
        />
      )}
    </div>
  );
}

function ImageField({
  name,
  label,
  required,
  disabled,
  showError,
}: {
  name: FieldName;
  label: string;
  required?: boolean;
  disabled?: boolean;
  showError: (content: string) => void;
}) {
  return (
    <Form.Item name={name} label={label} rules={[{ required }]}>
      <ProductImageUpload
        label={label}
        disabled={disabled}
        showError={showError}
      />
    </Form.Item>
  );
}

const ProductForm = ({
  product,
  onClose,
  onSuccess,
}: {
  product?: Website.Product;
  onClose: () => void;
  onSuccess: (locale: string) => void;
}) => {
  const intl = useIntl();
  const t = useText();
  const { styles } = useStyles();
  const [form] = Form.useForm<ProductFormValues>();
  const [modal, modalContext] = Modal.useModal();
  const [messageApi, messageContext] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const pending = useRef(false);
  const panels = [
    {
      key: 'base',
      title: t('base', '基础设置'),
      description: t(
        'baseDescription',
        '设置商品的基础信息，用于页面标题和分类管理。',
      ),
    },
    {
      key: 'card',
      title: t('card', '商品卡片与营销'),
      description: t(
        'cardDescription',
        '设置产品在列表和详情页内的基础营销信息。',
      ),
    },
    {
      key: 'features',
      title: t('features', '特点与优势'),
      description: t('featuresDescription', '展示产品的核心优势与卖点。'),
      intro: 'featureIntroduction',
      media: false,
    },
    {
      key: 'specifications',
      title: t('specifications', '技术参数'),
      description: t(
        'specificationsDescription',
        '展示产品的技术规格与详细参数。',
      ),
      intro: 'specificationIntroduction',
      media: false,
    },
    {
      key: 'applications',
      title: t('applications', '应用场景'),
      description: t('applicationsDescription', '展示产品的典型应用场景。'),
      intro: 'applicationIntroduction',
      media: true,
    },
    {
      key: 'cases',
      title: t('cases', '案例展示'),
      description: t('casesDescription', '展示真实的客户案例与项目成果。'),
      intro: 'caseIntroduction',
      media: true,
    },
  ] as const;
  const [activeKeys, setActiveKeys] = useState<string[]>(
    panels.map(({ key }) => key),
  );

  const close = () => {
    if (pending.current) return;
    if (!form.isFieldsTouched()) return onClose();
    modal.confirm({
      title: t('discardTitle', '放弃尚未保存的内容？'),
      content: t(
        'discardDescription',
        '返回列表后，本次填写的内容将不会保存。',
      ),
      okText: t('discard', '放弃并返回'),
      cancelText: t('continue', '继续填写'),
      onOk: onClose,
    });
  };

  const submit = async (values: ProductFormValues) => {
    if (pending.current) return;
    pending.current = true;
    setSubmitting(true);
    try {
      const productI18n = toProductTranslation(values);
      if (product) {
        await addProductI18n({ ...productI18n, productId: product.id });
      } else {
        await createProduct({
          categoryId: values.categoryId,
          slug: values.slug.trim(),
          sortOrder: values.sortOrder ?? 0,
          isRecommended: values.isRecommended ?? false,
          productI18n,
        });
      }
    } catch {
      return;
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
    onSuccess(values.locale);
  };

  const goToPanel = (index: number) => {
    const key = panels[index].key;
    setCurrentStep(index);
    setActiveKeys((keys) => (keys.includes(key) ? keys : [...keys, key]));
    requestAnimationFrame(() => {
      document
        .getElementById(`product-editor-${key}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const panelLabel = (
    index: number,
    title: string,
    description: string,
    key: string,
  ) => (
    <div
      id={`product-editor-${key}`}
      className={styles.panelLabel}
      onClick={() => setCurrentStep(index)}
    >
      <span className={styles.panelTitle}>
        <span className={styles.panelNumber}>
          {String(index + 1).padStart(2, '0')}
        </span>
        {title}
      </span>
      <span className={styles.panelDescription}>{description}</span>
    </div>
  );

  const listRules = [
    {
      validator: async (_: unknown, items: unknown[]) => {
        if (!items || items.length < 4)
          throw new Error(t('minimumItems', '至少填写 4 条内容'));
      },
    },
  ];

  const cardActions = (
    index: number,
    length: number,
    move: (from: number, to: number) => void,
    remove: (index: number | number[]) => void,
  ) => (
    <div className={styles.cardActions}>
      <Button
        size="small"
        icon={<ArrowUpOutlined />}
        disabled={submitting || index === 0}
        onClick={() => move(index, index - 1)}
      >
        {t('moveUp', '上移')}
      </Button>
      <Button
        size="small"
        icon={<ArrowDownOutlined />}
        disabled={submitting || index === length - 1}
        onClick={() => move(index, index + 1)}
      >
        {t('moveDown', '下移')}
      </Button>
      <Button
        size="small"
        danger
        icon={<DeleteOutlined />}
        disabled={submitting || length <= 4}
        onClick={() => remove(index)}
      >
        {t('remove', '删除')}
      </Button>
    </div>
  );

  const renderDetailList = (
    section: (typeof panels)[2] | (typeof panels)[3],
  ) => (
    <Form.List name={section.key} rules={listRules}>
      {(fields, { add, remove, move }, { errors }) => (
        <div className={styles.itemGrid}>
          {fields.map((field, index) => (
            <Card
              key={field.key}
              size="small"
              className={styles.itemCard}
              title={
                <span className={styles.cardTitle}>
                  <PictureOutlined className={styles.cardIcon} />
                  {section.title} {String(index + 1).padStart(2, '0')}
                </span>
              }
              extra={cardActions(index, fields.length, move, remove)}
            >
              <TextField
                name={[field.name, 'title']}
                label={
                  section.key === 'specifications'
                    ? t('parameterName', '参数名称')
                    : t('itemTitle', '标题')
                }
                placeholder={
                  section.key === 'specifications'
                    ? t('parameterNamePlaceholder', '例如：产品尺寸')
                    : t('featureTitlePlaceholder', '请输入优势标题')
                }
                required
                maxLength={256}
              />
              <TextField
                name={[field.name, 'content']}
                label={
                  section.key === 'specifications'
                    ? t('parameterValue', '参数值')
                    : t('featureContent', '特点说明')
                }
                placeholder={
                  section.key === 'specifications'
                    ? t('parameterValuePlaceholder', '例如：1200 × 800 mm')
                    : t('featureContentPlaceholder', '请输入详细说明')
                }
                required
                multiline={section.key !== 'specifications'}
              />
            </Card>
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => add({})}
          >
            {t('addItem', '添加条目')}
          </Button>
          <Form.ErrorList errors={errors} />
        </div>
      )}
    </Form.List>
  );

  const renderMediaList = (
    section: (typeof panels)[4] | (typeof panels)[5],
  ) => (
    <Form.List name={section.key} rules={listRules}>
      {(fields, { add, remove, move }, { errors }) => (
        <div className={styles.itemGrid}>
          {fields.map((field, index) => (
            <Card
              key={field.key}
              size="small"
              className={styles.itemCard}
              title={
                <span className={styles.cardTitle}>
                  <PictureOutlined className={styles.cardIcon} />
                  {section.title} {String(index + 1).padStart(2, '0')}
                </span>
              }
              extra={cardActions(index, fields.length, move, remove)}
            >
              <div className={styles.mediaLayout}>
                <ImageField
                  name={[field.name, 'imageUrl']}
                  label={t('itemImage', '上传图片')}
                  required
                  disabled={submitting}
                  showError={(content) => messageApi.error(content)}
                />
                <div>
                  <TextField
                    name={[field.name, 'title']}
                    label={t('itemTitle', '标题')}
                    placeholder={t('itemTitlePlaceholder', '请输入标题')}
                    required
                    maxLength={256}
                  />
                  <TextField
                    name={[field.name, 'description']}
                    label={t('description', '描述')}
                    placeholder={t('descriptionPlaceholder', '请输入简短描述')}
                    multiline
                  />
                </div>
              </div>
            </Card>
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => add({})}
          >
            {t('addItem', '添加条目')}
          </Button>
          <Form.ErrorList errors={errors} />
        </div>
      )}
    </Form.List>
  );

  const collapseItems = panels.map((panel, index) => {
    let children: ReactNode;
    if (panel.key === 'base') {
      children = (
        <>
          {product ? (
            <p>
              {t('sharedProduct', '当前商品：{name} · {slug} · ID {id}', {
                name: product.name,
                slug: product.slug,
                id: product.id,
              })}
            </p>
          ) : (
            <div className="grid gap-x-5 md:grid-cols-2">
              <Form.Item
                name="slug"
                label={t('slug', '商品标识')}
                extra={t(
                  'slugHint',
                  '用于官网详情页地址，例如 /products/wpc，创建后保持不变。',
                )}
                rules={[
                  { required: true },
                  {
                    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    message: t(
                      'slugInvalid',
                      '仅支持小写字母、数字和中划线，不能以中划线开头或结尾',
                    ),
                  },
                ]}
              >
                <Input placeholder="wpc" maxLength={128} />
              </Form.Item>
              <ProFormSelect
                name="categoryId"
                label={t('category', '所属分类')}
                rules={[{ required: true }]}
                params={{ locale: intl.locale }}
                showSearch
                fieldProps={{ optionFilterProp: 'label' }}
                extra={t(
                  'categoryHint',
                  '按当前界面语言加载分类；没有所需分类时，请先在分类管理中添加。',
                )}
                request={async () => {
                  const categories: Website.Category[] = [];
                  let pageNum = 1;
                  while (true) {
                    const page = await listCategories({
                      pageNum,
                      pageSize: 100,
                    });
                    categories.push(...page.records);
                    if (!page.records.length || categories.length >= page.total)
                      break;
                    pageNum += 1;
                  }
                  return categories.map((category) => ({
                    label: t('categoryOption', '{name} ({code})', {
                      name: category.name,
                      code: category.code,
                    }),
                    value: category.id,
                  }));
                }}
              />
              <Form.Item
                name="sortOrder"
                label={t('sortOrder', '展示排序')}
                extra={t('sortHint', '数值越小越靠前。')}
              >
                <InputNumber
                  className="w-full"
                  min={-2147483648}
                  max={2147483647}
                  precision={0}
                />
              </Form.Item>
              <Form.Item
                name="isRecommended"
                label={t('recommended', '全局推荐')}
                valuePropName="checked"
                extra={t('recommendedHint', '是否用于官网全局推荐展示位。')}
              >
                <Switch />
              </Form.Item>
            </div>
          )}
          <Form.Item
            name="locale"
            label={
              product
                ? t('targetLanguage', '目标语言')
                : t('initialLanguage', '首种语言')
            }
            rules={[{ required: true }]}
          >
            <Select
              placeholder={t('selectLanguage', '请选择内容语言')}
              options={categoryLanguages.map(({ label, value }) => ({
                label: intl.formatMessage(label),
                value,
                disabled: value === product?.locale,
              }))}
            />
          </Form.Item>
        </>
      );
    } else if (panel.key === 'card') {
      children = (
        <>
          <div className="grid gap-x-5 md:grid-cols-2">
            <TextField
              name="name"
              label={t('name', '商品名称')}
              placeholder={t('namePlaceholder', '请输入商品名称')}
              required
              maxLength={128}
            />
            <TextField
              name="subtitle"
              label={t('subtitle', '副标题')}
              placeholder={t('subtitlePlaceholder', '例如英文名称或营销短语')}
              maxLength={128}
            />
          </div>
          <TextField
            name="summary"
            label={t('summary', '卡片摘要')}
            placeholder={t(
              'summaryPlaceholder',
              '用于商品列表及关联商品卡片的简短介绍',
            )}
            multiline
            maxLength={300}
          />
          <TextField
            name="tagline"
            label={t('tagline', '详情页首屏文案')}
            placeholder={t('taglinePlaceholder', '展示在详情页商品名称下方')}
            multiline
            maxLength={500}
          />
          <ImageField
            name="coverImageUrl"
            label={t('coverImageUrl', '商品卡片封面')}
            disabled={submitting}
            showError={(content) => messageApi.error(content)}
          />
          <p className={styles.uploadHint}>
            {t('coverUploadHint', '支持 JPG、PNG 格式，大小不超过 5 MB。')}
          </p>
        </>
      );
    } else {
      children = (
        <>
          <TextField
            name={panel.intro}
            label={t('sectionIntroduction', '板块介绍')}
            placeholder={t(
              'sectionIntroductionPlaceholder',
              '请输入该模块的简要介绍',
            )}
            multiline
            maxLength={300}
          />
          {panel.key === 'features' && (
            <>
              <ImageField
                name="featureImageUrl"
                label={t('featureImageUrl', '特点区域配图')}
                disabled={submitting}
                showError={(content) => messageApi.error(content)}
              />
              <p className={styles.uploadHint}>
                {t(
                  'featureUploadHint',
                  '支持 JPG、PNG 格式，大小不超过 5 MB。',
                )}
              </p>
            </>
          )}
          <p className="text-sm text-gray-500">
            {t(
              'itemsHint',
              '至少填写 4 条，可继续添加，并通过上移、下移调整官网展示顺序。',
            )}
          </p>
          {panel.media
            ? renderMediaList(panel as (typeof panels)[4])
            : renderDetailList(panel as (typeof panels)[2])}
        </>
      );
    }
    return {
      key: panel.key,
      label: panelLabel(index, panel.title, panel.description, panel.key),
      children,
      forceRender: true,
    };
  });

  return (
    <PageContainer
      title={
        product ? t('addLanguage', '添加商品语言') : t('create', '新增商品')
      }
      onBack={close}
      footer={[
        <Button key="cancel" disabled={submitting} onClick={close}>
          {t('cancel', '取消')}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={() => form.submit()}
        >
          {product
            ? t('addLanguage', '添加商品语言')
            : t('createSubmit', '创建商品')}
        </Button>,
      ]}
      subTitle={
        product
          ? `${product.name} · ${product.slug}`
          : t('editorSubtitle', '按照官网展示顺序，组织商品的完整内容')
      }
    >
      {modalContext}
      {messageContext}
      <Form<ProductFormValues>
        form={form}
        layout="vertical"
        onFinish={submit}
        disabled={submitting}
        scrollToFirstError={{ block: 'center', focus: true }}
        validateMessages={{
          required: t('required', '此项为必填项'),
          whitespace: t('whitespace', '不能只填写空格'),
        }}
        initialValues={{
          locale: product
            ? undefined
            : categoryLanguages.some(({ value }) => value === intl.locale)
              ? intl.locale
              : 'zh-CN',
          sortOrder: 0,
          isRecommended: false,
          features: Array.from({ length: 4 }, () => ({})),
          specifications: Array.from({ length: 4 }, () => ({})),
          applications: Array.from({ length: 4 }, () => ({})),
          cases: Array.from({ length: 4 }, () => ({})),
        }}
      >
        <section
          className={styles.editorNotice}
          aria-labelledby="editor-notice-title"
        >
          <span className={styles.noticeIcon} aria-hidden="true">
            <InfoCircleFilled />
          </span>
          <div className={styles.noticeContent}>
            <h2 id="editor-notice-title" className={styles.noticeTitle}>
              {product
                ? t('translationHint', '为此商品添加一种新的语言内容')
                : t('createHint', '创建商品及首种语言内容')}
            </h2>
            <p className={styles.noticeDescription}>
              {product
                ? t(
                    'translationDescription',
                    '分类、商品标识和展示设置由所有语言共用。每种语言只能添加一次，已有语言不会被覆盖。',
                  )
                : t(
                    'createDescription',
                    '请完整填写各模块内容；新商品默认隐藏，可在内容确认后再安排官网展示。',
                  )}
            </p>
          </div>
        </section>
        <div className={styles.editorLayout}>
          <aside className={styles.stepsCard}>
            <Steps
              current={currentStep}
              orientation="vertical"
              items={panels.map(({ title }) => ({ title }))}
              onChange={goToPanel}
              size="small"
            />
          </aside>
          <Collapse
            className={styles.collapse}
            activeKey={activeKeys}
            expandIconPlacement="end"
            items={collapseItems}
            onChange={(key) => {
              const keys = (Array.isArray(key) ? key : [key]).map(String);
              const opened = keys.find((item) => !activeKeys.includes(item));
              if (opened) {
                const index = panels.findIndex((panel) => panel.key === opened);
                if (index >= 0) setCurrentStep(index);
              }
              setActiveKeys(keys);
            }}
          />
        </div>
      </Form>
    </PageContainer>
  );
};

export default ProductForm;
