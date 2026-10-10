import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  HolderOutlined,
  InfoCircleFilled,
  PictureOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Card, Form, Input, Upload } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { RcFile, UploadProps } from 'antd/es/upload/interface';
import { useRef, useState } from 'react';
import {
  uploadAttachment,
  WEBSITE_PRODUCT_ATTACHMENT_MODEL,
} from '@/services/system/attachment';
import type { ProductFormValues } from './formValues';
import { useStyles } from './index.style';

export default function ProductDetailImages({
  form,
  disabled,
  showError,
  onUploadingChange,
}: {
  form: FormInstance<ProductFormValues>;
  disabled: boolean;
  showError: (content: string) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const intl = useIntl();
  const t = (
    key: string,
    defaultMessage: string,
    values?: Record<string, string | number>,
  ) =>
    intl.formatMessage({ id: `productManager.${key}`, defaultMessage }, values);
  const { styles } = useStyles();
  const images: NonNullable<ProductFormValues['detailImages']> =
    Form.useWatch('detailImages', form) ??
    form.getFieldValue('detailImages') ??
    [];
  const viewer = useRef<HTMLElement>(null);
  const previewNodes = useRef(new Map<number, HTMLDivElement>());
  const draggedKey = useRef<number | null>(null);
  const [selectedKey, setSelectedKey] = useState<number | null>(null);
  const [dropKey, setDropKey] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const locateImage = (key: number) => {
    setSelectedKey(key);
    const container = viewer.current;
    const target = previewNodes.current.get(key);
    if (container && target) {
      container.scrollTo({
        top:
          container.scrollTop +
          target.getBoundingClientRect().top -
          container.getBoundingClientRect().top -
          container.clientTop,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Card
      size="small"
      className={styles.imageSection}
      title={
        <span className={styles.cardTitle}>
          {t('detailImages', '商品详情图')}
          <span className={styles.previewBadge}>
            {t('livePreview', '实时预览')}
          </span>
        </span>
      }
    >
      <p className={styles.sectionHint}>
        {t(
          'detailEditorHint',
          '至少上传 1 张图片。支持 JPG、PNG 格式，每张不超过 5 MB。',
        )}{' '}
        {t('detailImageSizeHint', '请统一图片宽度，建议宽度保持 1200px。')}
      </p>
      <Form.List
        name="detailImages"
        rules={[
          {
            validator: async (
              _: unknown,
              items?: ProductFormValues['detailImages'],
            ) => {
              if (!items?.some((item) => item?.imageAttachmentId != null)) {
                throw new Error(t('minimumImages', '至少上传 1 张图片'));
              }
            },
          },
        ]}
      >
        {(fields, { add, remove, move }, { errors }) => {
          const previews = fields.flatMap((field) => {
            const image = images[field.name];
            return image?.imageAttachmentId != null && image.imageUrl
              ? [{ key: field.key, url: image.imageUrl, index: field.name }]
              : [];
          });
          const activeKey = previews.some(({ key }) => key === selectedKey)
            ? selectedKey
            : previews[0]?.key;
          const customRequest: UploadProps['customRequest'] = async ({
            file,
            onSuccess,
            onError,
          }) => {
            setUploading(true);
            onUploadingChange(true);
            try {
              const attachment = await uploadAttachment(
                file as File,
                WEBSITE_PRODUCT_ATTACHMENT_MODEL,
              );
              if (attachment.id == null) {
                throw new Error(
                  t('uploadResponseError', '上传接口未返回附件 ID'),
                );
              }
              add({
                imageAttachmentId: attachment.id,
                imageUrl: attachment.previewUrl,
              });
              onSuccess?.(attachment);
            } catch (error) {
              showError(t('uploadError', '图片上传失败，请重试'));
              onError?.(
                error instanceof Error ? error : new Error(String(error)),
              );
            } finally {
              setUploading(false);
              onUploadingChange(false);
            }
          };
          const uploadProps: UploadProps = {
            accept: 'image/jpeg,image/png',
            showUploadList: false,
            beforeUpload,
            customRequest,
            disabled: disabled || uploading,
          };

          return (
            <>
              <div
                className={`${styles.productPresentation} ${styles.detailPresentation}`}
              >
                <section
                  className={`${styles.detailPanel} ${styles.detailPreviewPanel}`}
                >
                  <div className={styles.detailPanelHeader}>
                    <h3>{t('detailPreview', '详情预览')}</h3>
                    <span>{t('detailPreviewOrder', '按上传顺序展示')}</span>
                  </div>
                  <section
                    ref={viewer}
                    className={styles.detailViewer}
                    aria-label={t('detailPreview', '详情预览')}
                    // biome-ignore lint/a11y/noNoninteractiveTabindex: The scrollable preview needs keyboard access.
                    tabIndex={0}
                  >
                    {previews.length ? (
                      previews.map(({ key, url, index }) => (
                        <div
                          key={key}
                          ref={(node) => {
                            if (node) previewNodes.current.set(key, node);
                            else previewNodes.current.delete(key);
                          }}
                          className={styles.detailPreviewImage}
                          data-active={activeKey === key}
                        >
                          <img
                            src={url}
                            alt={t(
                              'detailPreviewImage',
                              '详情预览图片 {index}',
                              {
                                index: index + 1,
                              },
                            )}
                            draggable={false}
                          />
                        </div>
                      ))
                    ) : (
                      <div className={styles.detailEmpty}>
                        <PictureOutlined />
                        <strong>{t('detailPreview', '详情预览')}</strong>
                        <span>
                          {t(
                            'detailPreviewEmpty',
                            '上传图片后，在这里连续预览商品详情',
                          )}
                        </span>
                      </div>
                    )}
                  </section>
                </section>
                <section
                  className={`${styles.detailPanel} ${styles.detailManagementPanel}`}
                >
                  <div className={styles.detailPanelHeader}>
                    <div className={styles.detailManagementTitle}>
                      <h3>{t('imageManagement', '图片管理')}</h3>
                      <span>
                        {t('imageCount', '共 {count} 张', {
                          count: fields.length,
                        })}
                      </span>
                    </div>
                    <Upload {...uploadProps}>
                      <Button
                        icon={<PlusOutlined />}
                        disabled={disabled || uploading}
                        loading={uploading}
                        aria-label={t('uploadDetailImage', '上传详情图片')}
                      >
                        {t('itemImage', '上传图片')}
                      </Button>
                    </Upload>
                  </div>
                  <p className={styles.sectionHint}>
                    {t(
                      'detailManagementHint',
                      '拖动调整顺序，点击缩略图定位预览',
                    )}
                  </p>
                  <ul
                    className={styles.detailThumbnails}
                    aria-label={t('detailImageOrder', '详情图片顺序')}
                  >
                    {fields.map((field, index) => (
                      <li
                        key={field.key}
                        className={`${styles.carouselThumbnail} ${styles.detailThumbnail}`}
                        data-active={activeKey === field.key}
                        data-drop-target={dropKey === field.key}
                        draggable={!disabled}
                        onDragStart={(event) => {
                          draggedKey.current = field.key;
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData(
                            'text/plain',
                            String(field.key),
                          );
                        }}
                        onDragOver={(event) => {
                          if (disabled || draggedKey.current === null) return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                          setDropKey(field.key);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const from = fields.findIndex(
                            ({ key }) => key === draggedKey.current,
                          );
                          if (!disabled && from >= 0 && from !== index)
                            move(from, index);
                          draggedKey.current = null;
                          setDropKey(null);
                        }}
                        onDragEnd={() => {
                          draggedKey.current = null;
                          setDropKey(null);
                        }}
                      >
                        <Form.Item name={[field.name, 'imageUrl']} hidden>
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'imageAttachmentId']}
                          hidden
                          rules={[{ required: true }]}
                        >
                          <Input />
                        </Form.Item>
                        <div className={styles.detailThumbnailHeader}>
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          {activeKey === field.key && (
                            <span className={styles.previewBadge}>
                              {t('currentPreview', '当前预览')}
                            </span>
                          )}
                          <HolderOutlined
                            title={t('carouselDragHint', '拖动调整顺序')}
                          />
                        </div>
                        <button
                          type="button"
                          className={styles.detailThumbnailImage}
                          aria-label={t(
                            'selectDetailImage',
                            '预览第 {index} 张详情图',
                            {
                              index: index + 1,
                            },
                          )}
                          aria-pressed={activeKey === field.key}
                          onClick={() => locateImage(field.key)}
                        >
                          {images[field.name]?.imageUrl ? (
                            <img
                              src={images[field.name].imageUrl}
                              alt={t('itemImage', '上传图片')}
                              draggable={false}
                            />
                          ) : (
                            <PictureOutlined />
                          )}
                        </button>
                        <div className={styles.detailThumbnailActions}>
                          <Button
                            size="small"
                            icon={<ArrowUpOutlined />}
                            aria-label={t('moveUp', '上移')}
                            title={t('moveUp', '上移')}
                            disabled={disabled || index === 0}
                            onClick={() => move(index, index - 1)}
                          />
                          <Button
                            size="small"
                            icon={<ArrowDownOutlined />}
                            aria-label={t('moveDown', '下移')}
                            title={t('moveDown', '下移')}
                            disabled={disabled || index === fields.length - 1}
                            onClick={() => move(index, index + 1)}
                          />
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            aria-label={t('remove', '删除')}
                            title={t('remove', '删除')}
                            disabled={disabled}
                            onClick={() => remove(index)}
                          />
                        </div>
                      </li>
                    ))}
                    <li className={styles.detailUpload}>
                      <Upload {...uploadProps}>
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          className={styles.detailAddButton}
                          disabled={disabled || uploading}
                          loading={uploading}
                          aria-label={t('addDetailImage', '添加详情图片')}
                        >
                          {t('itemImage', '上传图片')}
                        </Button>
                      </Upload>
                    </li>
                  </ul>
                  <p className={styles.detailSyncHint}>
                    <InfoCircleFilled />
                    {t(
                      'detailSyncHint',
                      '上传、排序或删除后，左侧预览实时更新',
                    )}
                  </p>
                </section>
              </div>
              <div className={styles.carouselErrors}>
                <Form.ErrorList errors={errors} />
              </div>
            </>
          );
        }}
      </Form.List>
    </Card>
  );
}
