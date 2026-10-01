export type ProductFormValues = Omit<
  Website.ProductI18n,
  | 'features'
  | 'specifications'
  | 'applications'
  | 'cases'
  | 'carouselImages'
  | 'detailImages'
> & {
  categoryId: Website.Category['id'];
  slug: string;
  sortOrder?: number;
  isShow?: boolean;
  isRecommended?: boolean;
  features: Pick<Website.ProductDetailItem, 'title' | 'content'>[];
  specifications: Pick<Website.ProductDetailItem, 'title' | 'content'>[];
  applications: Pick<
    Website.ProductMediaItem,
    'title' | 'imageAttachmentId' | 'description'
  >[];
  cases: Pick<
    Website.ProductMediaItem,
    'title' | 'imageAttachmentId' | 'description'
  >[];
  carouselImages?: Pick<
    Website.ProductImageItem,
    'imageAttachmentId' | 'imageUrl'
  >[];
  detailImages?: Pick<
    Website.ProductImageItem,
    'imageAttachmentId' | 'imageUrl'
  >[];
};

export function toProductTranslation(
  values: ProductFormValues,
): Website.ProductI18n {
  const details = (
    items: ProductFormValues['features'],
    itemType: Website.ProductDetailItem['itemType'],
  ) =>
    items.map((item, sortOrder) => ({
      title: item.title.trim(),
      content: item.content.trim(),
      itemType,
      sortOrder,
    }));
  const media = (
    items: ProductFormValues['applications'],
    itemType: Website.ProductMediaItem['itemType'],
  ) =>
    items.map((item, sortOrder) => ({
      title: item.title.trim(),
      imageAttachmentId: item.imageAttachmentId,
      description: item.description?.trim(),
      itemType,
      sortOrder,
    }));
  const images = (
    items: ProductFormValues['carouselImages'],
    itemType: Website.ProductImageItem['itemType'],
  ) =>
    (items ?? []).map((item, sortOrder) => ({
      imageAttachmentId: item.imageAttachmentId,
      itemType,
      sortOrder,
    }));
  return {
    locale: values.locale,
    name: values.name.trim(),
    subtitle: values.subtitle?.trim(),
    summary: values.summary?.trim(),
    tagline: values.tagline?.trim(),
    featureIntroduction: values.featureIntroduction?.trim(),
    specificationIntroduction: values.specificationIntroduction?.trim(),
    applicationIntroduction: values.applicationIntroduction?.trim(),
    caseIntroduction: values.caseIntroduction?.trim(),
    coverImageAttachmentId: values.coverImageAttachmentId,
    featureImageAttachmentId: values.featureImageAttachmentId,
    features: details(values.features, 'FEATURE'),
    specifications: details(values.specifications, 'SPECIFICATION'),
    applications: media(values.applications, 'APPLICATION'),
    cases: media(values.cases, 'CASE'),
    carouselImages: images(values.carouselImages, 'CAROUSEL_IMAGE'),
    detailImages: images(values.detailImages, 'DETAIL_IMAGE'),
  };
}
