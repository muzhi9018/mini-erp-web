import { PhoneOutlined } from '@ant-design/icons';
import { history, Link, useLocation } from '@umijs/max';
import React, { useState } from 'react';
import BrandMark from './BrandMark';

const navigation = [
  { label: '首页', to: '/' },
  { label: '产品中心', to: '/products' },
  { label: '精选案例', to: '/#cases' },
  { label: '公司优势', to: '/#advantages' },
  { label: '关于我们', to: '/#about' },
  { label: '联系我们', to: '/#contact' },
];

const SiteHeader: React.FC = () => {
  const { hash, pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
    to: string,
  ) => {
    setIsOpen(false);

    if (to === '/') {
      event.preventDefault();
      history.push('/');
      window.scrollTo({
        behavior: pathname === '/' ? 'smooth' : 'auto',
        top: 0,
      });
      return;
    }

    if (!to.startsWith('/#')) {
      event.preventDefault();
      history.push(to);
      window.scrollTo({ behavior: 'auto', top: 0 });
      requestAnimationFrame(() =>
        window.scrollTo({ behavior: 'auto', top: 0 }),
      );
      return;
    }

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
    <header className="site-header">
      <div className="site-header__inner">
        <BrandMark onClick={(event) => handleNavigation(event, '/')} />
        <nav
          className={`site-header__nav ${isOpen ? 'is-open' : ''}`}
          aria-label="网站导航"
        >
          {navigation.map((item) => (
            <Link
              className={
                pathname === item.to ||
                (pathname === '/' &&
                  item.to.startsWith('/#') &&
                  hash === item.to.slice(1))
                  ? 'is-active'
                  : undefined
              }
              key={item.label}
              onClick={(event) => handleNavigation(event, item.to)}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
          <a
            className="site-header__consult site-header__consult--mobile"
            href="/#contact"
            onClick={(event) => handleNavigation(event, '/#contact')}
          >
            免费咨询
          </a>
        </nav>
        <a
          className="site-header__consult"
          href="/#contact"
          onClick={(event) => handleNavigation(event, '/#contact')}
        >
          <PhoneOutlined aria-hidden="true" />
          免费咨询
        </a>
        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? '关闭导航菜单' : '打开导航菜单'}
          className="site-header__menu-button"
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  );
};

export default SiteHeader;
