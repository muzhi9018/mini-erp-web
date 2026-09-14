declare namespace Website {

  type Category = {
    id: number | string;
    name: string;
    code: string;
    sortOrder: number;
    isShow: boolean;
    locale: string;
  };

  export type CategoryI18n = {
    locale: string;
    name: string;
    description?: string;
    imageUrl?: string;
  };

  export type CreateCategory = {
    code: string;
    sortOrder: number;
    categoryI18n: CategoryI18n;
  };

  export type AddCategoryI18n = CategoryI18n & {
    websiteProductCategoryId: Category['id'];
  };

  type CategoryPage = {
    records: Category[];
    total: number;
  };
}
