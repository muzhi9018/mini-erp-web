import { Link, useParams } from '@umijs/max';
import React from 'react';
import ProductCard from '../../components/ProductCard';
import SectionHeading from '../../components/SectionHeading';
import SiteFooter from '../../components/SiteFooter';
import SiteHeader from '../../components/SiteHeader';
import { productMap, products, websiteImages } from '../../data';
import '../../site.css';
import './index.css';

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

  const relatedProducts = products
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);

  return (
    <main className="zhulv-site product-detail-page">
      <SiteHeader />
      <section className="page-hero product-detail-page__hero">
        <img
          alt={product.name}
          className="page-hero__image"
          src={product.image}
        />
        <div className="page-hero__content">
          <div className="page-hero__crumbs">
            <Link to="/">首页</Link>
            <span>/</span>
            <Link to="/products">产品中心</Link>
            <span>/</span>
            <span>{product.name}</span>
          </div>
          <span className="page-hero__eyebrow">{product.englishName}</span>
          <h1>{product.name}</h1>
          <p>{product.tagline}</p>
        </div>
      </section>

      <section className="product-detail-page__intro detail-section">
        <div className="product-detail-page__intro-image">
          <img alt={`${product.name}应用`} src={product.image} />
        </div>
        <div>
          <SectionHeading
            centered={false}
            eyebrow="PRODUCT OVERVIEW"
            title="为质感空间而生"
          />
          <p className="product-detail-page__intro-copy">{product.summary}</p>
          <p className="product-detail-page__intro-copy">
            筑绿以稳定可靠的产品品质和可落地的工艺细节，协助设计师与业主将理想的空间效果高质量呈现。
          </p>
          <a className="site-button" href="/#contact">
            获取专属报价 <b aria-hidden="true">→</b>
          </a>
        </div>
      </section>

      <section className="product-detail-page__features detail-section detail-section--tint">
        <SectionHeading
          eyebrow="PRODUCT FEATURES"
          title="产品特点与优势"
          description="从材料本身到项目落地，以可靠品质支撑每一个设计细节。"
        />
        <div className="product-detail-page__feature-grid">
          {product.features.map((feature, index) => (
            <article key={feature.title}>
              <span>0{index + 1}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="product-detail-page__specifications detail-section">
        <SectionHeading
          eyebrow="TECHNICAL SPECIFICATIONS"
          title="技术参数"
          description="严谨把控每项产品指标，满足设计、施工与长期使用需求。"
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

      <section className="product-detail-page__applications detail-section detail-section--tint">
        <SectionHeading
          eyebrow="APPLICATION SCENARIOS"
          title="应用场景"
          description="适配多元空间需求，为设计师提供丰富的创作可能。"
        />
        <div className="product-detail-page__application-grid">
          {product.applications.map((application, index) => (
            <article key={application}>
              <img
                alt={application}
                loading="lazy"
                src={
                  index % 2 === 0 ? product.image : websiteImages.application
                }
              />
              <h3>{application}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="product-detail-page__related detail-section">
        <SectionHeading
          eyebrow="RELATED PRODUCTS"
          title="相关产品推荐"
          description="探索更多优质装饰材料，为您的项目找到更完整的搭配。"
        />
        <div className="product-grid">
          {relatedProducts.map((item) => (
            <ProductCard key={item.slug} product={item} />
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
};

export default ProductDetailPage;
