import { request } from '@umijs/max';

export async function listProducts(params: Website.ProductListParams) {
  return request<Website.ProductPage>('/website/product/list', {
    method: 'GET',
    params,
  });
}

export async function createProduct(data: Website.CreateProduct) {
  return request<Website.ProductCreated>('/website/product', {
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

export async function uploadProductImage(file: File) {
  const data = new FormData();
  data.append('file', file);
  return request<Website.ProductImage>('/website/product/image/upload', {
    method: 'POST',
    data,
  });
}
