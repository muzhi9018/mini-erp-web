import { Form } from 'antd';
import { ProductCount, useProductText } from '../shared';
import ImageEditor from './ImageEditor';

export default function SkuImagesField({
  prefix,
  onUploadingChange,
}: {
  prefix: (string | number)[];
  onUploadingChange: (uploading: boolean) => void;
}) {
  const t = useProductText();
  const name = [...prefix, 'images'];
  const images: Product.ImageDraft[] = Form.useWatch(name) ?? [];
  return (
    <details>
      <summary className="cursor-pointer">
        {t('skuImages')}{' '}
        <ProductCount>
          {images.length
            ? t('imageCount', { count: images.length })
            : t('optional')}
        </ProductCount>
      </summary>
      <p className="mt-3">{t('skuImageFallback')}</p>
      <Form.Item name={name} initialValue={[]}>
        <ImageEditor owner="sku" onUploadingChange={onUploadingChange} />
      </Form.Item>
    </details>
  );
}
