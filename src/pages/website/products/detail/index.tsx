import { Link, useIntl, useParams } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import {
  getWebsiteProductDetail,
  listWebsiteProducts,
} from '@/services/website/product';
import SiteFooter from '../../components/SiteFooter';
import SiteHeader from '../../components/SiteHeader';
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
  const [product, setProduct] = useState<Website.PublicProduct>();
  const [relatedProducts, setRelatedProducts] = useState<
    Website.PublicProduct[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ behavior: 'auto', top: 0 });
  }, [slug]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setProduct(undefined);
    setRelatedProducts([]);

    if (!slug) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const loadProduct = async () => {
      try {
        const nextProduct = await getWebsiteProductDetail(slug);
        const products = await listWebsiteProducts(
          nextProduct.categoryId,
        ).catch(() => []);

        if (!active) return;
        setProduct(nextProduct);
        setRelatedProducts(
          products.filter((item) => item.slug !== nextProduct.slug).slice(0, 4),
        );
      } catch {
        if (active) setProduct(undefined);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProduct();

    return () => {
      active = false;
    };
  }, [intl.locale, slug]);

  if (loading) {
    return (
      <main className="zhulv-site product-not-found">
        <SiteHeader />
        <section>
          <p>{intl.formatMessage({ id: 'website.productDetail.loading' })}</p>
        </section>
      </main>
    );
  }

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

  const features = product.features ?? [];
  const specifications = product.specifications ?? [];
  const applications = product.applications ?? [];
  const cases = product.cases ?? [];
  const featureImageUrl = product.featureImageUrl ?? product.coverImageUrl;

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
          {(product.tagline ?? product.summary) && (
            <p>{product.tagline ?? product.summary}</p>
          )}
        </div>
      </section>

      <section className="product-detail-page__features detail-section">
        <div className="product-detail-page__feature-layout">
          <div className="product-detail-page__feature-image">
            {featureImageUrl && (
              <img
                alt={intl.formatMessage(
                  { id: 'website.productDetail.feature.imageAlt' },
                  { productName: product.name },
                )}
                src={featureImageUrl}
              />
            )}
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
              {features.map((feature, index) => (
                <article key={`${feature.sortOrder}-${feature.title}`}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.content}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {specifications.length > 0 && (
        <section className="product-detail-page__specifications detail-section detail-section--sand">
          <DetailSectionHeader
            description={
              product.specificationIntroduction ??
              intl.formatMessage({
                id: 'website.productDetail.specifications.description',
              })
            }
            eyebrow="TECHNICAL SPECIFICATIONS"
            title={intl.formatMessage({
              id: 'website.productDetail.specifications.title',
            })}
          />
          <div className="product-detail-page__specification-table-wrap">
            <table>
              <tbody>
                {specifications.map((specification) => (
                  <tr key={`${specification.sortOrder}-${specification.title}`}>
                    <th>{specification.title}</th>
                    <td>{specification.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {applications.length > 0 && (
        <section className="product-detail-page__applications detail-section">
          <DetailSectionHeader
            description={
              product.applicationIntroduction ??
              intl.formatMessage({
                id: 'website.productDetail.applications.description',
              })
            }
            eyebrow="APPLICATION SCENARIOS"
            title={intl.formatMessage({
              id: 'website.productDetail.applications.title',
            })}
          />
          <div className="product-detail-page__application-grid">
            {applications.map((application, index) => (
              <article
                key={`${application.imageAttachmentId}-${application.title}`}
              >
                {application.imageUrl && (
                  <img
                    alt={application.title}
                    loading="lazy"
                    src={application.imageUrl}
                  />
                )}
                <div className="product-detail-page__application-copy">
                  <span>0{index + 1}</span>
                  <h3>{application.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {cases.length > 0 && (
        <section className="product-detail-page__gallery detail-section detail-section--sand">
          <DetailSectionHeader
            description={
              product.caseIntroduction ??
              intl.formatMessage({
                id: 'website.productDetail.gallery.description',
              })
            }
            eyebrow="PROJECT GALLERY"
            title={intl.formatMessage({
              id: 'website.productDetail.gallery.title',
            })}
          />
          <div className="product-detail-page__gallery-grid">
            {cases.map((caseItem) => (
              <article key={`${caseItem.imageAttachmentId}-${caseItem.title}`}>
                {caseItem.imageUrl && (
                  <img
                    alt={caseItem.title}
                    loading="lazy"
                    src={caseItem.imageUrl}
                  />
                )}
                <span aria-hidden="true">+</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {relatedProducts.length > 0 && (
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
                {relatedProduct.coverImageUrl && (
                  <img
                    alt={relatedProduct.name}
                    src={relatedProduct.coverImageUrl}
                  />
                )}
                <div className="product-detail-page__related-card-copy">
                  {relatedProduct.subtitle && (
                    <span>{relatedProduct.subtitle}</span>
                  )}
                  <h3>{relatedProduct.name}</h3>
                  {relatedProduct.summary && <p>{relatedProduct.summary}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
};

export default ProductDetailPage;
