import { request } from '@umijs/max';

/**
 * doGet
 * @param url 请求路径
 * @param params params
 * @param options options
 */
export async function doGet( url: string, params?: { [key: string]: any }, options?: { [key: string]: any } ) {
  return request(url, {
    method: 'GET',
    params: params,
    ...options,
  }).catch((error) => {
    if (!options?.catchError) {
      throw error;
    }
  });
}

/**
 * doPost
 * @param url 请求路径
 * @param data data
 * @param options options
 */
export async function doPost(url: string, data?: { [key: string]: any }, options?: { [key: string]: any } ) {
  return request(url, {
    method: 'POST',
    ...options,
    data: data,
  }).catch((error) => {
    if (!options?.catchError) {
      throw error;
    }
  });
}

/**
 * doPostForm post提交表单
 * @param url 请求路径
 * @param data 表单参数
 * @param options options
 */
export async function doPostFrom(url: string, data?: { [key: string]: any }, options?: { [key: string]: any } ) {
  const fromData = new FormData();
  Object.entries(data ?? {}).forEach((entity) => {
    const key = entity[0];
    const value = entity[1];
    if (value instanceof Array) {
      value.forEach((item) => {
        fromData.append(key, item);
      });
    } else {
      fromData.append(key, value);
    }
  });

  let headers = options && options.headers;
  return request(url, {
    method: 'POST',
    data: fromData,
    ...options,
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data',
    },
  }).catch((error) => {
    if (!options?.catchError) {
      throw error;
    }
  });
}
