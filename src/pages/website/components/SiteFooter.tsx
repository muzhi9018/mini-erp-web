import { history, Link, useIntl, useLocation } from '@umijs/max';
import React from 'react';
import { products } from '../data';
import BrandMark from './BrandMark';

const SiteFooter: React.FC = () => {
  const { pathname } = useLocation();
  const intl = useIntl();

  const handleHomeSectionNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
    to: string,
  ) => {
    if (pathname !== '/') {
      return;
    }

    event.preventDefault();
    history.push(to);
    document
      .getElementById(to.slice(2))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <section className="site-footer__intro">
          <BrandMark />
          <p>{intl.formatMessage({ id: 'website.footer.introduction' })}</p>
        </section>
        <section>
          <h2>{intl.formatMessage({ id: 'website.footer.productSeries' })}</h2>
          <ul>
            {products.slice(0, 5).map((product) => (
              <li key={product.slug}>
                <Link to={`/products/${product.slug}`}>{product.name}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>
            {intl.formatMessage({ id: 'website.footer.quickNavigation' })}
          </h2>
          <ul>
            <li>
              <Link
                onClick={(event) =>
                  handleHomeSectionNavigation(event, '/#about')
                }
                to="/#about"
              >
                {intl.formatMessage({ id: 'website.navigation.about' })}
              </Link>
            </li>
            <li>
              <Link to="/products">
                {intl.formatMessage({ id: 'website.navigation.products' })}
              </Link>
            </li>
            <li>
              <Link
                onClick={(event) =>
                  handleHomeSectionNavigation(event, '/#cases')
                }
                to="/#cases"
              >
                {intl.formatMessage({ id: 'website.navigation.cases' })}
              </Link>
            </li>
            <li>
              <Link
                onClick={(event) =>
                  handleHomeSectionNavigation(event, '/#advantages')
                }
                to="/#advantages"
              >
                {intl.formatMessage({ id: 'website.navigation.advantages' })}
              </Link>
            </li>
            <li>
              <Link
                onClick={(event) =>
                  handleHomeSectionNavigation(event, '/#contact')
                }
                to="/#contact"
              >
                {intl.formatMessage({ id: 'website.navigation.contact' })}
              </Link>
            </li>
          </ul>
        </section>
        <section className="site-footer__contact">
          <h2>
            {intl.formatMessage({ id: 'website.footer.contactInformation' })}
          </h2>
          <ul>
            <li>{intl.formatMessage({ id: 'website.footer.phone' })}</li>
            <li>{intl.formatMessage({ id: 'website.footer.email' })}</li>
            <li>{intl.formatMessage({ id: 'website.footer.address' })}</li>
            <li>{intl.formatMessage({ id: 'website.footer.hours' })}</li>
          </ul>
        </section>
      </div>
      <div className="site-footer__bottom">
        <span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            {intl.formatMessage({ id: 'website.footer.copyright' })}
          </a>
          ｜
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="jsx-3066022125 copyright-icp-text"
          >
            粤ICP备2025399213号-1
          </a>
        </span>
        <span></span>
      </div>
    </footer>
  );
};

export default SiteFooter;
