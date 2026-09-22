import { request } from '@umijs/max';

export async function listProducts(params: Website.ProductListParams) {
  return request<Website.ProductPage>('/website/product/list', {
    method: 'GET',
    params,
  });
}

export async function listProductLocales(productId: Website.Product['id']) {
  return request<System.SystemLocale[]>('/website/product/product/locales', {
    method: 'GET',
    params: { productId },
  });
}

export async function getProductDetail(
  productId: Website.Product['id'],
  locale: string,
) {
  return request<Website.PublicProduct>('/website/product/detail', {
    method: 'GET',
    params: { productId, locale },
  });
}

export async function listWebsiteProducts(
  categoryId?: Website.Category['id'],
) {
  const url = '/website/product/website/list';
  if (categoryId === undefined) {
    return request<Website.PublicProduct[]>(url, { method: 'GET' });
  }
  return request<Website.PublicProduct[]>(url, {
    method: 'GET',
    params: { categoryId },
  });
}

export async function getWebsiteProductDetail(slug: string) {
  return request<Website.PublicProduct>(
    `/website/product/website/detail/${encodeURIComponent(slug)}`,
    { method: 'GET' },
  );
}

export async function createProduct(data: Website.CreateProduct) {
  return request<Website.ProductCreated>('/website/product/create', {
    method: 'POST',
    data,
  });
}

export async function addProductI18n(data: Website.AddProductI18n) {
  return request<Website.ProductCreated>('/website/product/addI18n', {
    method: 'POST',
    data,
  });
}

export async function updateProduct(data: Website.UpdateProduct) {
  return request<void>('/website/product/update', {
    method: 'POST',
    data,
  });
}
