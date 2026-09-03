import { PhoneOutlined } from '@ant-design/icons';
import { history, Link, useIntl, useLocation } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import { LangDropdown } from '@/components';
import BrandMark from './BrandMark';

const getNavigation = (
  formatMessage: (descriptor: { id: string }) => string,
) => [
  {
    label: formatMessage({ id: 'website.navigation.home' }),
    section: 'home',
    to: '/',
  },
  {
    label: formatMessage({ id: 'website.navigation.about' }),
    section: 'about',
    to: '/#about',
  },
  {
    label: formatMessage({ id: 'website.navigation.products' }),
    section: 'products',
    to: '/products',
  },
  {
    label: formatMessage({ id: 'website.navigation.cases' }),
    section: 'cases',
    to: '/#cases',
  },
  {
    label: formatMessage({ id: 'website.navigation.advantages' }),
    section: 'advantages',
    to: '/#advantages',
  },
  {
    label: formatMessage({ id: 'website.navigation.contact' }),
    section: 'contact',
    to: '/#contact',
  },
];

const homeSectionIds = ['about', 'products', 'cases', 'advantages', 'contact'];

const SiteHeader: React.FC = () => {
  const { hash, pathname } = useLocation();
  const intl = useIntl();
  const [activeHomeSection, setActiveHomeSection] = useState('home');
  const [isOpen, setIsOpen] = useState(false);
  const navigation = getNavigation(intl.formatMessage);

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
        <BrandMark
          imageSrc="/images/logo.png"
          onClick={(event) => handleNavigation(event, '/')}
        />
        <nav
          className={`site-header__nav ${isOpen ? 'is-open' : ''}`}
          aria-label={intl.formatMessage({ id: 'website.navigation.label' })}
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
            {intl.formatMessage({ id: 'website.navigation.consultation' })}
          </a>
        </nav>
        <div className="site-header__actions">
          <a
            className="site-header__consult"
            href="/#contact"
            onClick={(event) => handleNavigation(event, '/#contact')}
          >
            <PhoneOutlined aria-hidden="true" />
            {intl.formatMessage({ id: 'website.navigation.consultation' })}
          </a>
          <div className="site-header__language">
            <LangDropdown />
          </div>
        </div>
        <button
          aria-expanded={isOpen}
          aria-label={intl.formatMessage({
            id: isOpen
              ? 'website.navigation.closeMenu'
              : 'website.navigation.openMenu',
          })}
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
