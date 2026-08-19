import { Link, useParams } from '@umijs/max';
import React from 'react';
import SiteFooter from '../../components/SiteFooter';
import SiteHeader from '../../components/SiteHeader';
import {
  productDetailImages,
  productMap,
  products,
  projectCases,
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
  const product = slug ? productMap[slug] : undefined;

  if (!product) {
    return (
      <main className="zhulv-site product-not-found">
        <SiteHeader />
        <section>
          <span>404</span>
          <h1>未找到该产品</h1>
          <p>您访问的产品页面不存在或已被调整。</p>
          <Link className="site-button" to="/products">
            返回产品中心
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
            <Link to="/">首页</Link>
            <span>/</span>
            <Link to="/products">产品中心</Link>
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
              alt={`${product.name}效果展示`}
              src={detailImages?.feature ?? product.image}
            />
          </div>
          <div className="product-detail-page__feature-copy">
            <span className="product-detail-page__eyebrow">
              PRODUCT FEATURES
            </span>
            <h2>产品特点与优势</h2>
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
          description="严格的品质管控，每项指标均达到或超过国家标准"
          eyebrow="TECHNICAL SPECIFICATIONS"
          title="技术参数"
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
          description="广泛应用于各类户外与室内空间，为设计师提供丰富的创作可能"
          eyebrow="APPLICATION SCENARIOS"
          title="应用场景"
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
          description="精选真实项目案例，见证塑木材料的多元应用与卓越表现"
          eyebrow="PROJECT GALLERY"
          title="案例展示"
        />
        <div className="product-detail-page__gallery-grid">
          {galleryImages.map((galleryImage, index) => (
            <article key={galleryImage}>
              <img
                alt={`${product.name}案例 ${index + 1}`}
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
          description="探索更多优质装饰材料，为您的项目找到最佳搭配"
          eyebrow="RELATED PRODUCTS"
          title="相关产品推荐"
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
