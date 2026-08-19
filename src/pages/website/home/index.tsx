import { Link } from '@umijs/max';
import React from 'react';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/SectionHeading';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { products, projectCases, websiteImages } from '../data';
import '../site.css';
import './index.css';

const advantages = [
  {
    icon: 'layers',
    title: '品类齐全',
    text: '12大产品系列、数百款规格，一站式满足全屋装饰材料需求。',
  },
  {
    icon: 'certified',
    title: '环保认证',
    text: '全系列产品通过多项环保检测，为健康空间提供可靠保障。',
  },
  {
    icon: 'delivery',
    title: '快速交付',
    text: '大型仓储中心备有常用现货，常规定制产品快速交付。',
  },
  {
    icon: 'service',
    title: '专业服务',
    text: '设计师与技术团队全程跟进，提供选材、深化与安装指导。',
  },
];

const AdvantageIcon: React.FC<{ name: string }> = ({ name }) => {
  if (name === 'layers') {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="m4 12 8 4 8-4" />
        <path d="m4 17 8 4 8-4" />
      </svg>
    );
  }

  if (name === 'certified') {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M12 3 19 6v5c0 4.6-2.9 8-7 10-4.1-2-7-5.4-7-10V6l7-3Z" />
        <path d="m8.7 11.8 2.2 2.2 4.5-4.5" />
      </svg>
    );
  }

  if (name === 'delivery') {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2.2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M3.8 20c.3-3.3 2.3-5.1 5.2-5.1 2.9 0 4.8 1.8 5.2 5.1" />
      <path d="M15.4 15.3c2.7.1 4.3 1.7 4.8 4.7" />
    </svg>
  );
};

const ContactIcon: React.FC<{ name: string }> = ({ name }) => {
  if (name === 'phone') {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M5.4 3.8 8 3.1l1.6 4.5-2 1.3a14 14 0 0 0 7.4 7.4l1.3-2 4.5 1.6-.7 2.6a2.4 2.4 0 0 1-2.5 1.7C10.8 19.4 4.6 13.2 3.7 6.4a2.4 2.4 0 0 1 1.7-2.6Z" />
      </svg>
    );
  }

  if (name === 'mail') {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
        <path d="m4.5 7 7.5 5.8L19.5 7" />
      </svg>
    );
  }

  if (name === 'location') {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M12 21s6-5.5 6-11A6 6 0 0 0 6 10c0 5.5 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2.2" />
    </svg>
  );
};

const HomePage: React.FC = () => (
  <main className="zhulv-site home-page">
    <SiteHeader />
    <section className="home-hero">
      <img
        alt="高端装饰材料综合应用空间"
        className="home-hero__image"
        src={websiteImages.hero}
      />
      <div className="home-hero__shade" />
      <div className="home-hero__content">
        <span>ZHU LV DECORATION MATERIALS</span>
        <h1>
          筑造精品空间
          <br />
          <em>绿色环保建材</em>
        </h1>
        <p>
          专注高端环保装饰材料一站式供应，汇聚塑木、柔性软石、PU石材、岩板、鎏金板等十二大产品系列，以匠心品质与创新设计，为每一个空间赋予独特质感与持久生命力。
        </p>
        <div className="home-hero__actions">
          <Link className="site-button" to="/products">
            探索产品 <b aria-hidden="true">→</b>
          </Link>
          <a className="site-button site-button--outline" href="/#contact">
            获取报价
          </a>
        </div>
      </div>
      <span className="home-hero__scroll">SCROLL</span>
    </section>

    <section className="home-about" id="about">
      <div className="home-about__gallery">
        <img alt="户外塑木平台景观" src={websiteImages.aboutOutdoor} />
        <img alt="PU石材客厅背景墙" src={websiteImages.aboutStone} />
        <img alt="岩板现代厨房" src={websiteImages.aboutKitchen} />
      </div>
      <div className="home-about__content">
        <span>ABOUT ZHU LV</span>
        <h2>匠心筑造，绿色赋能</h2>
        <p>
          筑绿装饰新材是一家致力于高端环保装饰材料研发、生产与销售的综合性企业。我们秉承“绿色筑造、品质为先”的理念，为商业空间、豪宅精装、酒店会所等领域提供一站式材料解决方案。
        </p>
        <p>
          自成立以来，公司始终坚持产品创新与品质管控，引进先进生产设备与工艺技术，建立完善的质量管理体系。产品不仅通过多项环保认证，更以卓越性能与美学设计，赢得众多设计师与开发商的青睐。
        </p>
        <p>
          从材料选择到空间呈现，筑绿以专业服务团队为支撑，为每一位客户提供从选材设计到安装指导的全流程服务，让绿色建材走进每一个品质空间。
        </p>
        <div className="home-about__stats">
          <div>
            <strong>
              12<sup>+</sup>
            </strong>
            <span>产品系列</span>
          </div>
          <div>
            <strong>
              500<sup>+</sup>
            </strong>
            <span>合作项目</span>
          </div>
          <div>
            <strong>
              15<sup>年</sup>
            </strong>
            <span>行业经验</span>
          </div>
        </div>
      </div>
    </section>

    <section className="home-products" id="products">
      <SectionHeading
        eyebrow="PRODUCT CATEGORIES"
        title="产品分类"
        description="十二大产品系列，涵盖墙面、地面、柜体、装饰等全方位装饰材料，满足不同风格与场景的设计需求。"
      />
      <div className="home-products__grid product-grid">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
      <Link className="home-products__more" to="/products">
        查看全部产品 <span>→</span>
      </Link>
    </section>

    <section className="home-cases" id="cases">
      <SectionHeading
        eyebrow="FEATURED PROJECTS"
        title="精选案例"
        description="精选真实项目案例，见证筑绿材料如何为不同空间带来质感升级与设计惊喜。"
      />
      <div className="home-cases__grid">
        {projectCases.map((project, index) => (
          <article
            className={`case-card case-card--${index + 1}`}
            key={project.title}
          >
            <img alt={project.title} loading="lazy" src={project.image} />
            <div>
              <span>{project.category}</span>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section className="home-advantages" id="advantages">
      <div className="home-advantages__inner">
        <SectionHeading
          eyebrow="OUR ADVANTAGES"
          title="为什么选择筑绿"
          description="我们以产品品质为核心，以专业服务为支撑，为每一位客户创造超越期待的价值。"
        />
        <div className="home-advantages__grid">
          {advantages.map((advantage) => (
            <article key={advantage.title}>
              <span className="home-advantages__icon">
                <AdvantageIcon name={advantage.icon} />
              </span>
              <h3>{advantage.title}</h3>
              <p>{advantage.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="home-contact" id="contact">
      <div className="home-contact__content">
        <SectionHeading
          centered={false}
          eyebrow="CONTACT US"
          title="联系我们"
          description="无论您是设计师、开发商还是终端客户，我们都期待与您沟通，为您提供最适合的装饰材料解决方案。"
        />
        <p>
          欢迎致电咨询或预约到样品展示厅参观选材，我们的专业顾问将为您提供一对一服务。
        </p>
      </div>
      <div className="home-contact__details">
        <div>
          <span className="home-contact__icon">
            <ContactIcon name="phone" />
          </span>
          <span className="home-contact__label">服务热线</span>
          <strong>400-888-6688</strong>
        </div>
        <div>
          <span className="home-contact__icon">
            <ContactIcon name="mail" />
          </span>
          <span className="home-contact__label">商务邮箱</span>
          <a href="mailto:sales@zhulv-decor.com">sales@zhulv-decor.com</a>
        </div>
        <div>
          <span className="home-contact__icon">
            <ContactIcon name="location" />
          </span>
          <span className="home-contact__label">总部地址</span>
          <p>广东省佛山市禅城区南庄陶瓷城</p>
        </div>
        <div>
          <span className="home-contact__icon">
            <ContactIcon name="time" />
          </span>
          <span className="home-contact__label">营业时间</span>
          <p>周一至周六 09:00 - 18:00</p>
        </div>
      </div>
    </section>
    <SiteFooter />
  </main>
);

export default HomePage;
