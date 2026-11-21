export const sameId = (
  a: Product.Id | null | undefined,
  b: Product.Id | null | undefined,
) => a != null && b != null && String(a) === String(b);

export function categoryOptions(categories: Product.Category[]): {
  title: string;
  value: string;
  key: string;
  children: ReturnType<typeof categoryOptions>;
}[] {
  return categories.map((category) => ({
    title: category.name,
    value: String(category.id),
    key: String(category.id),
    children: categoryOptions(category.children ?? []),
  }));
}

export function flattenCategories(
  categories: Product.Category[],
  parents: Product.Category[] = [],
): { category: Product.Category; path: string; depth: number }[] {
  return categories.flatMap((category) => {
    const chain = [...parents, category];
    return [
      {
        category,
        path: chain.map((item) => item.name).join(' / '),
        depth: chain.length,
      },
      ...flattenCategories(category.children ?? [], chain),
    ];
  });
}

export function normalizeDecimal(value: Product.Decimal): string {
  const text = String(value).trim();
  const [integer, fraction = ''] = text.replace(/^[+-]/, '').split('.');
  const digits = integer.replace(/^0+(?=\d)/, '') || '0';
  const tail = fraction.replace(/0+$/, '');
  const result = digits + (tail ? `.${tail}` : '');
  return text.startsWith('-') && result !== '0' ? `-${result}` : result;
}

export function validDecimal(
  value: unknown,
  scale = 6,
  signed = false,
): boolean {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  const text = String(value).trim();
  if (!(signed ? /^-?\d+(\.\d+)?$/ : /^\d+(\.\d+)?$/).test(text)) return false;
  const [integer, fraction = ''] = normalizeDecimal(text)
    .replace(/^-/, '')
    .split('.');
  return integer.length <= 14 && fraction.length <= scale;
}

export function combinationKey(selections: Product.Selection[]): string {
  return selections
    .map((item) => `${item.specId}:${item.specValueId}`)
    .sort()
    .join('|');
}

export type DraftSpec = Product.SpecInput & {
  tokens: string[];
  clientKey: string;
};

export function buildDraftSpecs(drafts: DraftSpec[]): Product.SpecInput[] {
  return drafts.map(({ tokens, ...spec }) => ({
    ...spec,
    name: spec.name.trim(),
    unitId: spec.valueType === 'NUMBER' ? spec.unitId : undefined,
    values: tokens.map((token, index) => ({
      clientKey: `${spec.clientKey}-${index}`,
      sortOrder: index,
      ...(spec.valueType === 'NUMBER'
        ? { numberValue: normalizeDecimal(token) }
        : { textValue: token.trim() }),
    })),
  }));
}

export function draftCombinations(specs: Product.SpecInput[]) {
  if (specs.reduce((count, spec) => count * spec.values.length, 1) > 1000) {
    throw new Error('combinationLimit');
  }
  return specs.reduce<
    {
      key: string;
      label: string;
      selections: NonNullable<Product.SkuInput['selections']>;
    }[]
  >(
    (rows, spec) =>
      rows.flatMap((row) =>
        spec.values.map((value) => ({
          key: `${row.key}/${JSON.stringify([spec.clientKey, spec.valueType, spec.unitId, value.textValue ?? value.numberValue])}`,
          label: [
            row.label,
            `${spec.name}: ${value.textValue ?? value.numberValue}`,
          ]
            .filter(Boolean)
            .join(' · '),
          selections: [
            ...row.selections,
            {
              specClientKey: spec.clientKey ?? '',
              valueClientKey: value.clientKey ?? '',
            },
          ],
        })),
      ),
    [{ key: 'default', label: '', selections: [] }],
  );
}

export function normalizeSku(values: Product.SkuValues): Product.SkuValues {
  return {
    code: values.code.trim(),
    model: values.model?.trim() || null,
    unitId: values.unitId,
    quantityScale: values.quantityScale ?? 0,
    images: (values.images ?? []).map(({ attachmentId, isCover }) => ({
      attachmentId,
      isCover,
    })),
    status: values.status,
    sortOrder: values.sortOrder ?? 0,
    ...skuPrices(values),
    stockQuantity:
      values.stockQuantity == null || values.stockQuantity === ''
        ? '0'
        : normalizeDecimal(values.stockQuantity),
  };
}

export function skuPrices(values: Product.SkuValues) {
  const purchase = String(values.referencePurchasePrice ?? '').trim();
  const sale = String(values.referenceSalePrice ?? '').trim();
  return {
    referencePurchasePrice: purchase || null,
    referencePurchaseCurrency: purchase
      ? values.referencePurchaseCurrency
      : null,
    referenceSalePrice: sale || null,
    referenceSaleCurrency: sale ? values.referenceSaleCurrency : null,
  };
}

export function formatSkuPrice(
  amount: Product.Decimal | null | undefined,
  currency: Product.Currency | null | undefined,
) {
  const symbol = currency === 'CNY' ? '¥' : currency === 'TWD' ? 'NT$' : '';
  if (amount == null || amount === '' || !symbol) return '—';
  // Keep the API's decimal precision when values arrive as strings.
  const [whole, fraction = ''] = normalizeDecimal(amount).split('.');
  return `${symbol} ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction.padEnd(2, '0')}`;
}

export function coverImage(images: Product.Image[]) {
  return images.find((image) => image.isCover) ?? images[0];
}
