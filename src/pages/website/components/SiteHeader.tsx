import { PhoneOutlined } from '@ant-design/icons';
import { history, Link, useLocation } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import BrandMark from './BrandMark';

const navigation = [
  { label: '首页', section: 'home', to: '/' },
  { label: '关于我们', section: 'about', to: '/#about' },
  { label: '产品中心', section: 'products', to: '/products' },
  { label: '精选案例', section: 'cases', to: '/#cases' },
  { label: '公司优势', section: 'advantages', to: '/#advantages' },
  { label: '联系我们', section: 'contact', to: '/#contact' },
];

const homeSectionIds = ['about', 'products', 'cases', 'advantages', 'contact'];

const SiteHeader: React.FC = () => {
  const { hash, pathname } = useLocation();
  const [activeHomeSection, setActiveHomeSection] = useState('home');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (pathname !== '/') {
      return;
    }

    const updateActiveHomeSection = () => {
      const headerHeight =
        document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 76;
      let nextSection = 'home';

      for (const sectionId of homeSectionIds) {
        const section = document.getElementById(sectionId);
        if (section && section.getBoundingClientRect().top <= headerHeight) {
          nextSection = sectionId;
        }
      }

      setActiveHomeSection(nextSection);
    };

    const hashSection = hash.slice(1);
    if (hashSection === 'home' || homeSectionIds.includes(hashSection)) {
      setActiveHomeSection(hashSection);
    } else {
      updateActiveHomeSection();
    }

    window.addEventListener('scroll', updateActiveHomeSection, {
      passive: true,
    });
    window.addEventListener('resize', updateActiveHomeSection);

    return () => {
      window.removeEventListener('scroll', updateActiveHomeSection);
      window.removeEventListener('resize', updateActiveHomeSection);
    };
  }, [hash, pathname]);

  const handleNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
    to: string,
  ) => {
    setIsOpen(false);

    if (to === '/') {
      event.preventDefault();
      setActiveHomeSection('home');
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
    setActiveHomeSection(to.slice(2));
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
                (pathname === '/' && activeHomeSection === item.section) ||
                (pathname !== '/' &&
                  (pathname === item.to ||
                    (item.to === '/products' &&
                      pathname.startsWith('/products/'))))
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
