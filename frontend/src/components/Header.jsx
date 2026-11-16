import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faCamera,
  faHouse,
  faPersonChalkboard,
  faPersonCirclePlus,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';
import { Link, useLocation } from 'react-router-dom';
import { getWordPressRestUrl } from '../wordpressApi.js';
import './Header.scss';

const DESKTOP_MEDIA_QUERY = '(min-width: 900px)';

const navigationIcons = {
  '/': faHouse,
  '/classes': faPersonChalkboard,
  '/gallery': faCamera,
  '/faqs': faQuestion,
  '/booking': faCalendarDays,
  '/recruit': faPersonCirclePlus,
};

function normalizePath(path) {
  return path.replace(/\/+$/, '') || '/';
}

function parseHeader(html) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const logo = document.querySelector('.aloha-logo--small');
  const links = Array.from(document.querySelectorAll('.aloha-nav a[href]')).map((link) => ({
    href: link.getAttribute('href'),
    label: link.textContent.trim(),
  }));

  if (!logo || !links.length) {
    throw new Error('The WordPress Header pattern is missing its small logo or navigation links.');
  }

  return {
    logoHtml: logo.outerHTML,
    links,
  };
}

export default function Header() {
  const [header, setHeader] = useState({ logoHtml: '', links: [] });
  const [status, setStatus] = useState('loading');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_MEDIA_QUERY).matches);
  const menuButtonRef = useRef(null);
  const navigationRef = useRef(null);
  const location = useLocation();
  const currentPath = normalizePath(location.pathname);

  const links = useMemo(() => header.links.map((link) => {
    const url = new URL(link.href, window.location.origin);
    const path = normalizePath(url.pathname);

    return {
      ...link,
      icon: navigationIcons[path],
      isInternal: url.origin === window.location.origin && link.href.startsWith('/'),
      isActive: url.origin === window.location.origin && path === currentPath,
    };
  }), [currentPath, header.links]);

  const closeMenu = useCallback((restoreFocus = false) => {
    setIsMenuOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setHeader({ logoHtml: '', links: [] });
    setStatus('loading');

    fetch(getWordPressRestUrl('aloha/v1/sections/header'), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`WordPress section API error ${response.status}`);
        return response.json();
      })
      .then((section) => {
        setHeader(parseHeader(section.html));
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error);
          setStatus('error');
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handleChange = (event) => {
      setIsDesktop(event.matches);
      if (event.matches) closeMenu(false);
    };

    setIsDesktop(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [closeMenu]);

  useEffect(() => {
    closeMenu(false);
  }, [closeMenu, location.pathname]);

  useEffect(() => {
    if (!isMenuOpen || isDesktop) return undefined;

    const bodyOverflow = document.body.style.overflow;
    const backgroundElements = Array.from(document.querySelectorAll(
      '.site-layout__content, .contact-us__full, .contact-us__jump, .site-footer',
    ));
    const previousAccessibility = backgroundElements.map((element) => ({
      element,
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.hasAttribute('inert'),
    }));

    document.body.style.overflow = 'hidden';
    document.body.classList.add('aloha-menu-open');
    backgroundElements.forEach((element) => {
      element.setAttribute('aria-hidden', 'true');
      element.setAttribute('inert', '');
    });

    const firstLink = navigationRef.current?.querySelector('a');
    window.requestAnimationFrame(() => firstLink?.focus());

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = [
        menuButtonRef.current,
        ...Array.from(navigationRef.current?.querySelectorAll('a[href]') || []),
      ].filter(Boolean);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = bodyOverflow;
      document.body.classList.remove('aloha-menu-open');
      previousAccessibility.forEach(({ element, ariaHidden, inert }) => {
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);

        if (!inert) element.removeAttribute('inert');
      });
    };
  }, [closeMenu, isDesktop, isMenuOpen]);

  return (
    <>
      <header className={`aloha-header theme-green${isMenuOpen ? ' is-menu-open' : ''}`}>
        <div className="aloha-header__bar">
          {status === 'loading' && <p className="aloha-header__status">Loading navigation…</p>}
          {status === 'error' && <p className="aloha-header__status" role="alert">Unable to load navigation.</p>}

          {status === 'ready' && (
            <>
              <Link
                aria-label="Aloha Academy home"
                className="aloha-header__logo-link"
                to="/"
                dangerouslySetInnerHTML={{ __html: header.logoHtml }}
              />

              <button
                aria-controls="aloha-primary-navigation"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="aloha-header__menu-button"
                onClick={() => (isMenuOpen ? closeMenu(true) : setIsMenuOpen(true))}
                ref={menuButtonRef}
                type="button"
              >
                <span />
                <span />
                <span />
              </button>

              <nav
                aria-hidden={isDesktop ? undefined : !isMenuOpen}
                aria-label="Main navigation"
                className="aloha-header__navigation"
                id="aloha-primary-navigation"
                ref={navigationRef}
              >
                <ul>
                  {links.map((link) => {
                    const className = `aloha-header__navigation-link${link.isActive ? ' is-active' : ''}`;
                    const content = (
                      <>
                        {link.icon && <FontAwesomeIcon aria-hidden="true" icon={link.icon} />}
                        <span>{link.label}</span>
                      </>
                    );

                    return (
                      <li key={`${link.href}-${link.label}`}>
                        {link.isActive ? (
                          <span
                            aria-current="page"
                            className={className}
                          >
                            {content}
                          </span>
                        ) : link.isInternal ? (
                          <Link
                            className={className}
                            onClick={() => closeMenu(!isDesktop)}
                            to={link.href}
                          >
                            {content}
                          </Link>
                        ) : (
                          <a
                            className={className}
                            href={link.href}
                            onClick={() => closeMenu(!isDesktop)}
                          >
                            {content}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </>
          )}
        </div>
      </header>

      {isMenuOpen && !isDesktop && (
        <div
          aria-hidden="true"
          className="aloha-header__overlay"
          onClick={() => closeMenu(true)}
        />
      )}
    </>
  );
}
