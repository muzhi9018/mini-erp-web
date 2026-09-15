export type ProductFormValues = Omit<
  Website.ProductI18n,
  'features' | 'specifications' | 'applications' | 'cases'
> & {
  categoryId: Website.Category['id'];
  slug: string;
  sortOrder?: number;
  isRecommended?: boolean;
  features: Pick<Website.ProductDetailItem, 'title' | 'content'>[];
  specifications: Pick<Website.ProductDetailItem, 'title' | 'content'>[];
  applications: Pick<
    Website.ProductMediaItem,
    'title' | 'imageUrl' | 'description'
  >[];
  cases: Pick<Website.ProductMediaItem, 'title' | 'imageUrl' | 'description'>[];
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
      imageUrl: item.imageUrl.trim(),
      description: item.description?.trim(),
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
    coverImageUrl: values.coverImageUrl?.trim(),
    featureImageUrl: values.featureImageUrl?.trim(),
    features: details(values.features, 'FEATURE'),
    specifications: details(values.specifications, 'SPECIFICATION'),
    applications: media(values.applications, 'APPLICATION'),
    cases: media(values.cases, 'CASE'),
  };
}
