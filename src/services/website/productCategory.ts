import { request } from '@umijs/max';



export async function listCategories(params: {
  pageNum: number;
  pageSize: number;
}) {
  return request<Website.CategoryPage>('/website/product/category/list', {
    method: 'GET',
    params,
  });
}

export async function createCategory(data: Website.CreateCategory) {
  return request('/website/product/category', { method: 'POST', data });
}

export async function addCategoryI18n(data: Website.AddCategoryI18n) {
  return request('/website/product/category/addI18n', { method: 'POST', data });
}
