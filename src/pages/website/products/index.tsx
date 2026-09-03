import { useIntl } from '@umijs/max';
import React, { useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/SectionHeading';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { getProductCategories, type ProductCategory, products } from '../data';
import '../site.css';
import './index.css';

const ProductCenterPage: React.FC = () => {
  const intl = useIntl();
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const productCategories = getProductCategories(intl.formatMessage);
  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) => category === 'all' || product.category === category,
      ),
    [category],
  );

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
              aria-selected={category === item.value}
              className={category === item.value ? 'is-active' : ''}
              key={item.value}
              onClick={() => setCategory(item.value)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
        {visibleProducts.length === 0 && (
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
