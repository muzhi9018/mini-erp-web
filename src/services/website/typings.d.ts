declare namespace Website {

  type Product = {
    id: number | string;
    name: string;
    slug: string;
    categoryId: number | string;
    sortOrder: number;
    isShow: boolean;
    isRecommended: boolean;
    locale: string;
  };

  type ProductListParams = {
    pageNum: number;
    pageSize: number;
  };

  type ProductPage = {
    records: Product[];
    total: number;
  };

  type ProductDetailItem = {
    itemType: 'FEATURE' | 'SPECIFICATION';
    title: string;
    content: string;
    sortOrder: number;
  };

  type ProductMediaItem = {
    itemType: 'APPLICATION' | 'CASE';
    title: string;
    description?: string;
    imageUrl: string;
    sortOrder: number;
  };

  type ProductI18n = {
    locale: string;
    name: string;
    subtitle?: string;
    summary?: string;
    tagline?: string;
    featureIntroduction?: string;
    specificationIntroduction?: string;
    applicationIntroduction?: string;
    caseIntroduction?: string;
    coverImageUrl?: string;
    featureImageUrl?: string;
    features: ProductDetailItem[];
    specifications: ProductDetailItem[];
    applications: ProductMediaItem[];
    cases: ProductMediaItem[];
  };

  type CreateProduct = {
    categoryId: Category['id'];
    slug: string;
    sortOrder: number;
    isRecommended: boolean;
    productI18n: ProductI18n;
  };

  type AddProductI18n = ProductI18n & {
    productId: Product['id'];
  };

  type ProductCreated = {
    productId: Product['id'];
    productI18nId: number | string;
    locale: string;
  };

  type ProductImage = {
    url: string;
  };

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
