import { useIntl } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import { listWebsiteProducts } from '@/services/website/product';
import { listWebsiteCategories } from '@/services/website/productCategory';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/SectionHeading';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import '../site.css';
import './index.css';

type CategoryFilter = Website.Category['id'] | 'all';

const ProductCenterPage: React.FC = () => {
  const intl = useIntl();
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [categories, setCategories] = useState<Website.PublicCategory[]>([]);
  const [products, setProducts] = useState<Website.PublicProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    let active = true;
    setCategories([]);
    listWebsiteCategories()
      .then((items) => {
        if (active) {
          setCategories(items);
          setCategory((currentCategory) =>
            currentCategory === 'all' ||
            items.some((item) => item.id === currentCategory)
              ? currentCategory
              : 'all',
          );
        }
      })
      .catch(() => {
        if (active) setCategories([]);
      });

    return () => {
      active = false;
    };
  }, [intl.locale]);

  useEffect(() => {
    let active = true;
    setLoadingProducts(true);
    setProducts([]);
    listWebsiteProducts(category === 'all' ? undefined : category)
      .then((items) => {
        if (active) {
          setProducts(items);
        }
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, [category, intl.locale]);

  const productCategories = [
    {
      id: 'all' as const,
      name: intl.formatMessage({ id: 'website.productCategory.all' }),
    },
    ...categories,
  ];

  return (
    <main className="zhulv-site product-center-page">
      <SiteHeader />
      <section className="page-hero product-center-page__hero">
        <div className="page-hero__content">
          <span className="page-hero__eyebrow">PRODUCT CENTER</span>
          <h1>{intl.formatMessage({ id: 'website.products.hero.title' })}</h1>
          <p>
            {intl.formatMessage({ id: 'website.products.hero.description' })}
          </p>
        </div>
      </section>
      <section className="product-center-page__body">
        <SectionHeading
          eyebrow="MATERIAL COLLECTION"
          title={intl.formatMessage({
            id: 'website.products.collection.title',
          })}
          description={intl.formatMessage({
            id: 'website.products.collection.description',
          })}
        />
        <div
          className="product-center-page__filters"
          role="tablist"
          aria-label={intl.formatMessage({
            id: 'website.products.categoryFilter',
          })}
        >
          {productCategories.map((item) => (
            <button
              aria-selected={category === item.id}
              className={category === item.id ? 'is-active' : ''}
              key={item.id}
              onClick={() => setCategory(item.id)}
              role="tab"
              type="button"
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
        {loadingProducts && (
          <p className="product-center-page__empty">
            {intl.formatMessage({ id: 'website.products.loading' })}
          </p>
        )}
        {!loadingProducts && products.length === 0 && (
          <p className="product-center-page__empty">
            {intl.formatMessage({ id: 'website.products.empty' })}
          </p>
        )}
      </section>
      <section className="product-center-page__consult">
        <div>
          <span>NEED A MATERIAL SOLUTION?</span>
          <h2>
            {intl.formatMessage({
              id: 'website.products.consultation.title',
            })}
          </h2>
          <p>
            {intl.formatMessage({
              id: 'website.products.consultation.description',
            })}
          </p>
        </div>
        <a className="site-button" href="/#contact">
          {intl.formatMessage({
            id: 'website.products.consultation.action',
          })}{' '}
          <b aria-hidden="true">→</b>
        </a>
      </section>
      <SiteFooter />
    </main>
  );
};

export default ProductCenterPage;
