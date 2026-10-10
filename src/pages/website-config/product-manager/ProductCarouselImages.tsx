import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  HolderOutlined,
  LeftOutlined,
  PictureOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Card, Carousel, Form, Input, Upload } from 'antd';
import type { CarouselRef } from 'antd/es/carousel';
import type { FormInstance } from 'antd/es/form';
import type { RcFile, UploadProps } from 'antd/es/upload/interface';
import { useRef, useState } from 'react';
import {
  uploadAttachment,
  WEBSITE_PRODUCT_ATTACHMENT_MODEL,
} from '@/services/system/attachment';
import type { ProductFormValues } from './formValues';
import { useStyles } from './index.style';

export default function ProductCarouselImages({
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
  const images: NonNullable<ProductFormValues['carouselImages']> =
    Form.useWatch('carouselImages', form) ??
    form.getFieldValue('carouselImages') ??
    [];
  const carousel = useRef<CarouselRef>(null);
  const draggedKey = useRef<number | null>(null);
  const [dropKey, setDropKey] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
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

  return (
    <Card
      size="small"
      title={t('carouselImages', '商品轮播图')}
      className={styles.imageSection}
    >
      <p className={styles.sectionHint}>
        {t(
          'carouselEditorHint',
          '至少上传 1 张图片，拖动下方图片调整顺序，点击缩略图预览。支持 JPG、PNG 格式，每张不超过 5 MB。',
        )}
        <br />
        {t('carouselImageSizeHint', '图片比例 1:1，建议尺寸 1200px × 1200px。')}
      </p>
      <Form.List
        name="carouselImages"
        rules={[
          {
            validator: async (
              _: unknown,
              items?: ProductFormValues['carouselImages'],
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
              ? [{ key: field.key, url: image.imageUrl }]
              : [];
          });
          const current = previews[Math.min(activeSlide, previews.length - 1)];
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
              setActiveSlide(0);
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
          const reorder = (from: number, to: number) => {
            setActiveSlide(0);
            move(from, to);
          };

          return (
            <>
              <div className={styles.carouselEditor}>
                <section
                  className={styles.carouselPreview}
                  aria-label={t('carouselPreview', '轮播预览')}
                >
                  {previews.length ? (
                    <>
                      <Carousel
                        key={previews.map(({ key }) => key).join(',')}
                        ref={carousel}
                        autoplay={previews.length > 1}
                        autoplaySpeed={4000}
                        afterChange={setActiveSlide}
                        className={styles.carouselSlider}
                      >
                        {previews.map(({ key, url }, index) => (
                          <div key={key}>
                            <img
                              src={url}
                              alt={t(
                                'carouselPreviewImage',
                                '轮播预览图片 {index}',
                                {
                                  index: index + 1,
                                },
                              )}
                              draggable={false}
                            />
                          </div>
                        ))}
                      </Carousel>
                      {previews.length > 1 && (
                        <>
                          <Button
                            shape="circle"
                            className={styles.carouselPrevious}
                            icon={<LeftOutlined />}
                            aria-label={t('previousImage', '上一张图片')}
                            onClick={() => carousel.current?.prev()}
                          />
                          <Button
                            shape="circle"
                            className={styles.carouselNext}
                            icon={<RightOutlined />}
                            aria-label={t('nextImage', '下一张图片')}
                            onClick={() => carousel.current?.next()}
                          />
                        </>
                      )}
                      <span
                        className={styles.carouselCounter}
                        aria-live="polite"
                      >
                        {Math.min(activeSlide, previews.length - 1) + 1} /{' '}
                        {previews.length}
                      </span>
                    </>
                  ) : (
                    <div className={styles.carouselEmpty}>
                      <PictureOutlined />
                      <strong>{t('carouselPreview', '轮播预览')}</strong>
                      <span>
                        {t(
                          'carouselPreviewEmpty',
                          '上传图片后，在这里实时预览轮播效果',
                        )}
                      </span>
                    </div>
                  )}
                </section>
                <ul
                  className={styles.carouselThumbnails}
                  aria-label={t('carouselImageOrder', '轮播图片顺序')}
                >
                  {fields.map((field, index) => (
                    <li
                      key={field.key}
                      className={styles.carouselThumbnail}
                      data-active={current?.key === field.key}
                      data-drop-target={dropKey === field.key}
                      draggable={!disabled}
                      onDragStart={(event) => {
                        if (disabled) return;
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
                          reorder(from, index);
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
                      <button
                        type="button"
                        className={styles.carouselThumbnailImage}
                        aria-label={t(
                          'selectCarouselImage',
                          '预览第 {index} 张轮播图',
                          { index: index + 1 },
                        )}
                        aria-pressed={current?.key === field.key}
                        onClick={() => {
                          const slide = previews.findIndex(
                            ({ key }) => key === field.key,
                          );
                          if (slide >= 0) carousel.current?.goTo(slide);
                        }}
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
                      <div className={styles.carouselThumbnailToolbar}>
                        <span
                          className={styles.carouselDragHandle}
                          title={t('carouselDragHint', '拖动调整顺序')}
                        >
                          <HolderOutlined />
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className={styles.cardActions}>
                          <Button
                            size="small"
                            icon={<ArrowUpOutlined />}
                            aria-label={t('moveUp', '上移')}
                            title={t('moveUp', '上移')}
                            disabled={disabled || index === 0}
                            onClick={() => reorder(index, index - 1)}
                          />
                          <Button
                            size="small"
                            icon={<ArrowDownOutlined />}
                            aria-label={t('moveDown', '下移')}
                            title={t('moveDown', '下移')}
                            disabled={disabled || index === fields.length - 1}
                            onClick={() => reorder(index, index + 1)}
                          />
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            aria-label={t('remove', '删除')}
                            title={t('remove', '删除')}
                            disabled={disabled}
                            onClick={() => {
                              setActiveSlide(0);
                              remove(index);
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                  <li className={styles.carouselUpload}>
                    <Upload
                      accept="image/jpeg,image/png"
                      showUploadList={false}
                      beforeUpload={beforeUpload}
                      customRequest={customRequest}
                      disabled={disabled}
                    >
                      <Button
                        type="dashed"
                        disabled={disabled}
                        loading={uploading}
                        icon={<PlusOutlined />}
                        className={styles.carouselAddButton}
                        aria-label={t('addImage', '添加图片')}
                      >
                        {t('addImage', '添加图片')}
                      </Button>
                    </Upload>
                  </li>
                </ul>
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
