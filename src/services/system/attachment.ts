import { request } from '@umijs/max';

export const WEBSITE_PRODUCT_CATEGORY_ATTACHMENT_MODEL =
  'WEBSITE_PRODUCT_CATEGORY';
export const WEBSITE_PRODUCT_ATTACHMENT_MODEL = 'WEBSITE_PRODUCT';

/** 上传附件 */
export async function uploadAttachment(file: File, model: string) {
  const data = new FormData();
  data.append('file', file);
  data.append('model', model);

  return request<System.Attachment>('/attachment/upload', {
    method: 'POST',
    data,
  });
}
