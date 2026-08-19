import { PhoneOutlined } from '@ant-design/icons';
import { Link, useLocation } from '@umijs/max';
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
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <BrandMark />
        <nav
          className={`site-header__nav ${isOpen ? 'is-open' : ''}`}
          aria-label="网站导航"
        >
          {navigation.map((item) => (
            <Link
              className={pathname === item.to ? 'is-active' : undefined}
              key={item.label}
              onClick={() => setIsOpen(false)}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
          <a
            className="site-header__consult site-header__consult--mobile"
            href="/#contact"
            onClick={() => setIsOpen(false)}
          >
            免费咨询
          </a>
        </nav>
        <a className="site-header__consult" href="/#contact">
          <span aria-hidden="true">⌕</span>
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
