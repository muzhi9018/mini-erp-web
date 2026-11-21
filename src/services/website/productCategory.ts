import { request } from '@umijs/max';
import { doGet } from '@/services/httpClient';

export async function listCategories(params: {
  pageNum: number;
  pageSize: number;
}): Promise<Common.Page<Website.Category>> {
  return doGet('/website/product/category/list', params);
}

export async function listWebsiteCategories() {
  return request<Website.PublicCategory[]>(
    '/website/product/category/website/list',
    { method: 'GET' },
  );
}

export async function createCategory(data: Website.CreateCategory) {
  return request('/website/product/category/create', { method: 'POST', data });
}

export async function addCategoryI18n(data: Website.AddCategoryI18n) {
  return request('/website/product/category/addI18n', { method: 'POST', data });
}
