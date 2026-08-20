import { history, Link, useLocation } from '@umijs/max';
import React from 'react';
import { products } from '../data';
import BrandMark from './BrandMark';

const SiteFooter: React.FC = () => {
  const { pathname } = useLocation();

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
          <p>
            专注高端环保装饰材料供应，以匠心品质与创新设计，为每一个空间赋予独特质感与持久生命力。
          </p>
        </section>
        <section>
          <h2>产品系列</h2>
          <ul>
            {products.slice(0, 5).map((product) => (
              <li key={product.slug}>
                <Link to={`/products/${product.slug}`}>{product.name}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>快速导航</h2>
          <ul>
            <li>
              <Link
                onClick={(event) =>
                  handleHomeSectionNavigation(event, '/#about')
                }
                to="/#about"
              >
                关于我们
              </Link>
            </li>
            <li>
              <Link to="/products">产品中心</Link>
            </li>
            <li>
              <Link
                onClick={(event) =>
                  handleHomeSectionNavigation(event, '/#cases')
                }
                to="/#cases"
              >
                精选案例
              </Link>
            </li>
            <li>
              <Link
                onClick={(event) =>
                  handleHomeSectionNavigation(event, '/#advantages')
                }
                to="/#advantages"
              >
                公司优势
              </Link>
            </li>
            <li>
              <Link
                onClick={(event) =>
                  handleHomeSectionNavigation(event, '/#contact')
                }
                to="/#contact"
              >
                联系我们
              </Link>
            </li>
          </ul>
        </section>
        <section className="site-footer__contact">
          <h2>联系方式</h2>
          <ul>
            <li>服务热线：400-888-6688</li>
            <li>商务邮箱：sales@zhulv-decor.com</li>
            <li>总部地址：广东佛山禅城区南庄陶瓷城</li>
            <li>营业时间：周一至周六 09:00-18:00</li>
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
            Copyright © 2026-2035 筑绿装饰新材 版权所有
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
