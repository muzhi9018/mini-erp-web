import { Link, useIntl, useLocation } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import { listWebsiteProducts } from '@/services/website/product';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/SectionHeading';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { getProjectCases, websiteImages } from '../data';
import '../site.css';
import './index.css';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { LineBrandOutlined } from '@/components';

const getAdvantages = (
  formatMessage: (descriptor: { id: string }) => string,
) => [
  {
    icon: 'layers',
    title: formatMessage({ id: 'website.home.advantages.categories.title' }),
    text: formatMessage({
      id: 'website.home.advantages.categories.description',
    }),
  },
  {
    icon: 'certified',
    title: formatMessage({ id: 'website.home.advantages.environment.title' }),
    text: formatMessage({
      id: 'website.home.advantages.environment.description',
    }),
  },
  {
    icon: 'delivery',
    title: formatMessage({ id: 'website.home.advantages.delivery.title' }),
    text: formatMessage({
      id: 'website.home.advantages.delivery.description',
    }),
  },
  {
    icon: 'service',
    title: formatMessage({ id: 'website.home.advantages.service.title' }),
    text: formatMessage({
      id: 'website.home.advantages.service.description',
    }),
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

const HomePage: React.FC = () => {
  const { hash } = useLocation();
  const intl = useIntl();
  const advantages = getAdvantages(intl.formatMessage);
  const projectCases = getProjectCases(intl.formatMessage);
  const [websiteProducts, setWebsiteProducts] = useState<
    Website.PublicProduct[]
  >([]);

  useEffect(() => {
    let active = true;
    setWebsiteProducts([]);
    listWebsiteProducts()
      .then((items) => {
        if (active) {
          setWebsiteProducts(items);
        }
      })
      .catch(() => {
        if (active) setWebsiteProducts([]);
      });

    return () => {
      active = false;
    };
  }, [intl.locale]);

  useEffect(() => {
    if (!hash) {
      return;
    }

    const target = document.getElementById(hash.slice(1));
    if (!target) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => cancelAnimationFrame(frame);
  }, [hash]);

  return (
    <main className="zhulv-site home-page">
      <SiteHeader />
      <section className="home-hero">
        <img
          alt={intl.formatMessage({ id: 'website.home.hero.imageAlt' })}
          className="home-hero__image"
          src={websiteImages.hero}
        />
        <div className="home-hero__shade" />
        <div className="home-hero__content">
          <span>ZHU LV DECORATION MATERIALS</span>
          <h1>
            {intl.formatMessage({ id: 'website.home.hero.titleStart' })}
            <br />
            <em>{intl.formatMessage({ id: 'website.home.hero.titleEnd' })}</em>
          </h1>
          <p>{intl.formatMessage({ id: 'website.home.hero.description' })}</p>
          <div className="home-hero__actions">
            <Link className="site-button" to="/products">
              {intl.formatMessage({ id: 'website.home.hero.exploreProducts' })}{' '}
              <b aria-hidden="true">→</b>
            </Link>
            <a className="site-button site-button--outline" href="/#contact">
              {intl.formatMessage({ id: 'website.home.hero.getQuote' })}
            </a>
          </div>
        </div>
        <span className="home-hero__scroll">SCROLL</span>
      </section>

      <section className="home-about" id="about">
        <div className="home-about__gallery">
          <img
            alt={intl.formatMessage({
              id: 'website.home.about.outdoorImageAlt',
            })}
            src={websiteImages.aboutOutdoor}
          />
          <img
            alt={intl.formatMessage({ id: 'website.home.about.stoneImageAlt' })}
            src={websiteImages.aboutStone}
          />
          <img
            alt={intl.formatMessage({
              id: 'website.home.about.kitchenImageAlt',
            })}
            src={websiteImages.aboutKitchen}
          />
        </div>
        <div className="home-about__content">
          <span>ABOUT ZHU LV</span>
          <h2>{intl.formatMessage({ id: 'website.home.about.title' })}</h2>
          <p>{intl.formatMessage({ id: 'website.home.about.paragraph1' })}</p>
          <p>{intl.formatMessage({ id: 'website.home.about.paragraph2' })}</p>
          <p>{intl.formatMessage({ id: 'website.home.about.paragraph3' })}</p>
          <div className="home-about__stats">
            <div>
              <strong>
                12<sup>+</sup>
              </strong>
              <span>
                {intl.formatMessage({ id: 'website.home.about.productSeries' })}
              </span>
            </div>
            <div>
              <strong>
                500<sup>+</sup>
              </strong>
              <span>
                {intl.formatMessage({ id: 'website.home.about.projects' })}
              </span>
            </div>
            <div>
              <strong>
                15
                <sup>
                  {intl.formatMessage({ id: 'website.home.about.years' })}
                </sup>
              </strong>
              <span>
                {intl.formatMessage({
                  id: 'website.home.about.industryExperience',
                })}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-products" id="products">
        <SectionHeading
          eyebrow="PRODUCT CATEGORIES"
          title={intl.formatMessage({ id: 'website.home.products.title' })}
          description={intl.formatMessage({
            id: 'website.home.products.description',
          })}
        />
        <div className="home-products__grid product-grid">
          {websiteProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
        <Link className="home-products__more" to="/products">
          {intl.formatMessage({ id: 'website.home.products.viewAll' })}{' '}
          <span>→</span>
        </Link>
      </section>

      <section className="home-cases" id="cases">
        <SectionHeading
          eyebrow="FEATURED PROJECTS"
          title={intl.formatMessage({ id: 'website.home.cases.title' })}
          description={intl.formatMessage({
            id: 'website.home.cases.description',
          })}
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
            title={intl.formatMessage({ id: 'website.home.advantages.title' })}
            description={intl.formatMessage({
              id: 'website.home.advantages.description',
            })}
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
            title={intl.formatMessage({ id: 'website.home.contact.title' })}
            description={intl.formatMessage({
              id: 'website.home.contact.description',
            })}
          />
          <p>{intl.formatMessage({ id: 'website.home.contact.message' })}</p>
        </div>
        <div className="home-contact__details">
          <div>
            <span className="home-contact__icon">
              <LineBrandOutlined />
            </span>
            <span className="home-contact__label">
              {intl.formatMessage({ id: 'website.home.contact.line' })}
            </span>
            <a href="https://lin.ee/N2TZCiCL">https://lin.ee/N2TZCiCL</a>
          </div>
          <div>
            <span className="home-contact__icon">
              <MailOutlined />
            </span>
            <span className="home-contact__label">
              {intl.formatMessage({ id: 'website.home.contact.email' })}
            </span>
            <a href="mailto:sales@greenbuild.tw.cn">sales@greenbuild.tw.cn</a>
          </div>
          <div>
            <span className="home-contact__icon">
              <EnvironmentOutlined />
            </span>
            <span className="home-contact__label">
              {intl.formatMessage({ id: 'website.home.contact.address' })}
            </span>
            <p>
              {intl.formatMessage({ id: 'website.home.contact.addressValue' })}
            </p>
          </div>
          <div>
            <span className="home-contact__icon">
              <ClockCircleOutlined />
            </span>
            <span className="home-contact__label">
              {intl.formatMessage({ id: 'website.home.contact.hours' })}
            </span>
            <p>
              {intl.formatMessage({ id: 'website.home.contact.hoursValue' })}
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
};

export default HomePage;
