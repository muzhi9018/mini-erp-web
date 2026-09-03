import { Link, useIntl, useParams } from '@umijs/max';
import React, { useEffect } from 'react';
import SiteFooter from '../../components/SiteFooter';
import SiteHeader from '../../components/SiteHeader';
import {
  getProjectCases,
  productDetailImages,
  productMap,
  products,
  websiteImages,
} from '../../data';
import '../../site.css';
import './index.css';

interface DetailSectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

const DetailSectionHeader: React.FC<DetailSectionHeaderProps> = ({
  eyebrow,
  title,
  description,
}) => (
  <header className="product-detail-page__section-header">
    <span>{eyebrow}</span>
    <h2>{title}</h2>
    <i aria-hidden="true" />
    <p>{description}</p>
  </header>
);

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const intl = useIntl();
  const product = slug ? productMap[slug] : undefined;
  const projectCases = getProjectCases(intl.formatMessage);

  useEffect(() => {
    window.scrollTo({ behavior: 'auto', top: 0 });
  }, [slug]);

  if (!product) {
    return (
      <main className="zhulv-site product-not-found">
        <SiteHeader />
        <section>
          <span>404</span>
          <h1>
            {intl.formatMessage({ id: 'website.productDetail.notFound.title' })}
          </h1>
          <p>
            {intl.formatMessage({
              id: 'website.productDetail.notFound.description',
            })}
          </p>
          <Link className="site-button" to="/products">
            {intl.formatMessage({ id: 'website.productDetail.notFound.back' })}
          </Link>
        </section>
      </main>
    );
  }

  const detailImages = productDetailImages[product.slug];
  const applicationImages =
    detailImages?.applications ??
    product.applications.map((_, index) =>
      index % 2 === 0 ? product.image : websiteImages.application,
    );
  const galleryImages =
    detailImages?.gallery ?? projectCases.map((item) => item.image);
  const relatedProducts =
    product.slug === 'wpc'
      ? ['flexible-stone', 'pu-stone', 'aluminum', 'resin-stone'].map(
          (relatedSlug) => productMap[relatedSlug],
        )
      : products.filter((item) => item.slug !== product.slug).slice(0, 4);

  return (
    <main className="zhulv-site product-detail-page">
      <SiteHeader />

      <section className="product-detail-page__hero">
        <div className="product-detail-page__hero-content">
          <div className="product-detail-page__crumbs">
            <Link to="/">
              {intl.formatMessage({
                id: 'website.productDetail.breadcrumb.home',
              })}
            </Link>
            <span>/</span>
            <Link to="/products">
              {intl.formatMessage({
                id: 'website.productDetail.breadcrumb.products',
              })}
            </Link>
            <span>/</span>
            <span>{product.name}</span>
          </div>
          <h1>{product.name}</h1>
          <p>{product.tagline}</p>
        </div>
      </section>

      <section className="product-detail-page__features detail-section">
        <div className="product-detail-page__feature-layout">
          <div className="product-detail-page__feature-image">
            <img
              alt={intl.formatMessage(
                { id: 'website.productDetail.feature.imageAlt' },
                { productName: product.name },
              )}
              src={detailImages?.feature ?? product.image}
            />
          </div>
          <div className="product-detail-page__feature-copy">
            <span className="product-detail-page__eyebrow">
              PRODUCT FEATURES
            </span>
            <h2>
              {intl.formatMessage({
                id: 'website.productDetail.feature.title',
              })}
            </h2>
            <i aria-hidden="true" />
            <p>{product.featureIntroduction ?? product.summary}</p>
            <div className="product-detail-page__feature-list">
              {product.features.map((feature, index) => (
                <article key={feature.title}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="product-detail-page__specifications detail-section detail-section--sand">
        <DetailSectionHeader
          description={intl.formatMessage({
            id: 'website.productDetail.specifications.description',
          })}
          eyebrow="TECHNICAL SPECIFICATIONS"
          title={intl.formatMessage({
            id: 'website.productDetail.specifications.title',
          })}
        />
        <div className="product-detail-page__specification-table-wrap">
          <table>
            <tbody>
              {product.specifications.map(([label, value]) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="product-detail-page__applications detail-section">
        <DetailSectionHeader
          description={intl.formatMessage({
            id: 'website.productDetail.applications.description',
          })}
          eyebrow="APPLICATION SCENARIOS"
          title={intl.formatMessage({
            id: 'website.productDetail.applications.title',
          })}
        />
        <div className="product-detail-page__application-grid">
          {product.applications.map((application, index) => (
            <article key={application}>
              <img
                alt={application}
                loading="lazy"
                src={applicationImages[index]}
              />
              <div className="product-detail-page__application-copy">
                <span>0{index + 1}</span>
                <h3>{application}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="product-detail-page__gallery detail-section detail-section--sand">
        <DetailSectionHeader
          description={intl.formatMessage({
            id: 'website.productDetail.gallery.description',
          })}
          eyebrow="PROJECT GALLERY"
          title={intl.formatMessage({
            id: 'website.productDetail.gallery.title',
          })}
        />
        <div className="product-detail-page__gallery-grid">
          {galleryImages.map((galleryImage, index) => (
            <article key={galleryImage}>
              <img
                alt={intl.formatMessage(
                  { id: 'website.productDetail.gallery.imageAlt' },
                  { index: index + 1, productName: product.name },
                )}
                loading="lazy"
                src={galleryImage}
              />
              <span aria-hidden="true">+</span>
            </article>
          ))}
        </div>
      </section>

      <section className="product-detail-page__related detail-section detail-section--sand">
        <DetailSectionHeader
          description={intl.formatMessage({
            id: 'website.productDetail.related.description',
          })}
          eyebrow="RELATED PRODUCTS"
          title={intl.formatMessage({
            id: 'website.productDetail.related.title',
          })}
        />
        <div className="product-detail-page__related-grid">
          {relatedProducts.map((relatedProduct) => (
            <Link
              className="product-detail-page__related-card"
              key={relatedProduct.slug}
              to={`/products/${relatedProduct.slug}`}
            >
              <img alt={relatedProduct.name} src={relatedProduct.image} />
              <div className="product-detail-page__related-card-copy">
                <span>{relatedProduct.englishName}</span>
                <h3>{relatedProduct.name}</h3>
                <p>{relatedProduct.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
};

export default ProductDetailPage;
