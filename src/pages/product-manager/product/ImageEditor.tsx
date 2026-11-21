import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { App, Button, Image, Space, Tag } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { uploadProductImage } from '@/services/product/product';
import { useStyles } from '../index.style';
import { useProductText } from '../shared';

const imageTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
];

export default function ImageEditor({
  value = [],
  onChange,
  disabled = false,
  readOnly = false,
  onUploadingChange,
  owner = 'product',
}: {
  value?: Product.ImageDraft[];
  onChange?: (images: Product.ImageDraft[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  owner?: 'product' | 'sku';
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const t = useProductText();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const latest = useRef(value);
  latest.current = value;
  const dragged = useRef<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [pending, setPending] = useState(0);
  const uploading = pending > 0;
  const uploadStatus = useRef(onUploadingChange);
  uploadStatus.current = onUploadingChange;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    uploadStatus.current?.(uploading);
    return () => uploadStatus.current?.(false);
  }, [uploading]);
  const update = (images: Product.ImageDraft[]) => {
    if (images.length && !images.some((image) => image.isCover))
      images = images.map((image, index) => ({
        ...image,
        isCover: index === 0,
      }));
    latest.current = images;
    onChange?.(images);
  };
  const move = (from: number, to: number) => {
    if (disabled || from === to || to < 0 || to >= latest.current.length)
      return;
    const images = [...latest.current];
    images.splice(to, 0, ...images.splice(from, 1));
    update(images);
  };
  const upload = async (file: File) => {
    if (!imageTypes.includes(file.type)) {
      message.error(t('imageType'));
      return;
    }
    setPending((count) => count + 1);
    try {
      const attachment = await uploadProductImage(file);
      if (attachment.id == null) throw new Error(t('uploadResponse'));
      if (mounted.current)
        update([
          ...latest.current,
          {
            attachmentId: attachment.id,
            url: attachment.previewUrl,
            isCover: latest.current.length === 0,
          },
        ]);
    } catch {
      if (mounted.current) message.error(t('uploadError'));
    } finally {
      if (mounted.current) setPending((count) => count - 1);
    }
  };
  return (
    <div>
      {!value.length && (
        <div className="grid justify-items-center gap-2 py-4">
          <PictureOutlined className={styles.muted} />
          <strong>{t('emptyImages')}</strong>
        </div>
      )}
      <Image.PreviewGroup>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,112px),1fr))] gap-2.5">
          {value.map((image, index) => (
            <div
              key={image.attachmentId}
              className={styles.galleryItem}
              data-cover={image.isCover}
              data-drop={dropIndex === index}
              draggable={!readOnly && !disabled}
              onDragStart={(event) => {
                dragged.current = index;
                event.dataTransfer.setData('text/plain', String(index));
              }}
              onDragOver={(event) => {
                if (dragged.current == null || disabled || readOnly) return;
                event.preventDefault();
                setDropIndex(index);
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragged.current != null) move(dragged.current, index);
                dragged.current = null;
                setDropIndex(null);
              }}
              onDragEnd={() => {
                dragged.current = null;
                setDropIndex(null);
              }}
            >
              {image.url ? (
                <Image src={image.url} alt={t('images')} width="100%" />
              ) : (
                <div className="grid aspect-square place-items-center">
                  <PictureOutlined />
                </div>
              )}
              {image.isCover && (
                <Tag
                  color="processing"
                  className="pointer-events-none absolute top-1.5 start-1.5"
                >
                  {t('cover')}
                </Tag>
              )}
              <div className="flex flex-wrap items-center justify-center gap-0.5 p-1">
                <span className={`text-xs ${styles.muted}`}>
                  {t('imagePosition', { index: index + 1 })}
                </span>
                {!readOnly && !image.isCover && (
                  <Button
                    type="text"
                    size="small"
                    disabled={disabled}
                    onClick={() =>
                      update(
                        latest.current.map((item, itemIndex) => ({
                          ...item,
                          isCover: index === itemIndex,
                        })),
                      )
                    }
                  >
                    {t('setCover')}
                  </Button>
                )}
                {!readOnly && (
                  <Space size={2}>
                    <Button
                      size="small"
                      icon={<ArrowLeftOutlined />}
                      aria-label={t('moveUp')}
                      title={t('moveUp')}
                      disabled={disabled || index === 0}
                      onClick={() => move(index, index - 1)}
                    />
                    <Button
                      size="small"
                      icon={<ArrowRightOutlined />}
                      aria-label={t('moveDown')}
                      title={t('moveDown')}
                      disabled={disabled || index === value.length - 1}
                      onClick={() => move(index, index + 1)}
                    />
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={t('removeImage')}
                      title={t('removeImage')}
                      disabled={disabled}
                      onClick={() =>
                        update(
                          latest.current.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        )
                      }
                    />
                  </Space>
                )}
              </div>
            </div>
          ))}
        </div>
      </Image.PreviewGroup>
      {!readOnly && (
        <div className="mt-4 grid gap-2">
          <label className="grid gap-1 text-[13px]">
            <span>
              {t(owner === 'sku' ? 'addSkuImages' : 'addProductImages')}
            </span>
            <input
              type="file"
              className={styles.fileInput}
              multiple
              accept={imageTypes.join(',')}
              disabled={disabled || uploading}
              onChange={(event) => {
                const input = event.currentTarget;
                const files = Array.from(input.files ?? []);
                input.value = '';
                for (const file of files) void upload(file);
              }}
            />
            <small className={styles.muted}>{t('imageOrdering')}</small>
          </label>
          <div className="flex flex-wrap justify-between gap-2">
            <small className={styles.muted} aria-live="polite">
              {t(uploading ? 'uploading' : 'imageReplacement')}
            </small>
            {!!value.length && (
              <Button
                type="text"
                disabled={disabled || uploading}
                onClick={() => update([])}
              >
                {t('clearImages')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
