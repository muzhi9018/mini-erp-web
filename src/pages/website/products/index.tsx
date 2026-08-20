import React, { useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/SectionHeading';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { type ProductCategory, productCategories, products } from '../data';
import '../site.css';
import './index.css';

const ProductCenterPage: React.FC = () => {
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
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
          <h1>产品中心</h1>
          <p>
            十二大产品系列，覆盖墙面、地面、柜体、户外景观与装饰收边，为每一个项目提供专业、完整的材料解决方案。
          </p>
        </div>
      </section>
      <section className="product-center-page__body">
        <SectionHeading
          eyebrow="MATERIAL COLLECTION"
          title="探索筑绿产品系列"
          description="从材质、色彩到安装落地，为不同风格和场景找到适合的空间表达。"
        />
        <div
          className="product-center-page__filters"
          role="tablist"
          aria-label="产品分类筛选"
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
          <p className="product-center-page__empty">暂未找到对应产品。</p>
        )}
      </section>
      <section className="product-center-page__consult">
        <div>
          <span>NEED A MATERIAL SOLUTION?</span>
          <h2>告诉我们您的空间需求</h2>
          <p>筑绿顾问将为您匹配产品、规格与落地方案。</p>
        </div>
        <a className="site-button" href="/#contact">
          立即咨询 <b aria-hidden="true">→</b>
        </a>
      </section>
      <SiteFooter />
    </main>
  );
};

export default ProductCenterPage;
