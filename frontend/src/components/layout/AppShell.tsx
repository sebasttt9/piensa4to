import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Activity, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appNavigation } from '../../lib/navigation';
import './AppShell.css';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navWidth = 280;
  const initialDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
  const [navOpen, setNavOpen] = useState(initialDesktop);
  const [isDesktop, setIsDesktop] = useState(initialDesktop);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia('(min-width: 1024px)');
    const syncNavState = (event: MediaQueryList | MediaQueryListEvent) => {
      const matches = 'matches' in event ? event.matches : media.matches;
      setIsDesktop(matches);
      setNavOpen(matches);
    };

    syncNavState(media);

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', syncNavState);
      return () => media.removeEventListener('change', syncNavState);
    }

    media.addListener(syncNavState);
    return () => media.removeListener(syncNavState);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      return;
    }
    setNavOpen(false);
  }, [isDesktop, location.pathname]);

  const toggleNav = () => setNavOpen((prev) => !prev);
  const closeNav = () => setNavOpen(false);

  const activeNav = appNavigation.find((item) => location.pathname.startsWith(item.to));
  const sectionTitle = activeNav?.label ?? 'Panel principal';
  const mainClasses = useMemo(() => {
    const classes = ['app-shell__main'];
    if (isDesktop && navOpen) {
      classes.push('app-shell__main--with-nav');
    }
    if (!isDesktop && navOpen) {
      classes.push('app-shell__main--shifted');
    }
    return classes.join(' ');
  }, [isDesktop, navOpen]);
  const asideHiddenForMobile = !navOpen && !isDesktop;
  const userInitials = useMemo(() => {
    if (!user?.name) {
      return 'AD';
    }
    const parts = user.name.trim().split(/\s+/);
    const [first, second] = parts;
    const firstInitial = first?.[0] ?? '';
    const secondInitial = second?.[0] ?? (parts[parts.length - 1]?.[0] ?? '');
    return `${firstInitial}${secondInitial}`.toUpperCase();
  }, [user?.name]);

  const shellStyles = useMemo(
    () => ({
      '--app-shell-nav-width': `${navWidth}px`,
    }) as CSSProperties,
    [navWidth],
  );

  return (
    <div
      className="app-shell"
      style={shellStyles}
    >
      {navOpen && !isDesktop && (
        <button
          type="button"
          aria-label="Cerrar panel de navegación"
          className="app-shell__overlay"
          onClick={closeNav}
        />
      )}

      <aside
        className={`app-shell__aside ${navOpen ? 'app-shell__aside--open' : ''}`}
        aria-hidden={asideHiddenForMobile}
      >
        <div className="app-shell__brand">
          <div className="app-shell__brand-badge">
            <Activity className="app-shell__brand-icon" strokeWidth={2.5} />
          </div>
          <div className="app-shell__brand-copy">
            <span className="app-shell__brand-title">DataPulse</span>
            <span className="app-shell__brand-subtitle">Business Analytics</span>
          </div>
        </div>

        <nav className="app-shell__nav">
          {appNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (!isDesktop) {
                    closeNav();
                  }
                }}
                className={({ isActive }) => `app-shell__nav-link ${isActive ? 'is-active' : ''}`}
              >
                <span className="app-shell__nav-icon">
                  <Icon className="app-shell__nav-icon-svg" />
                </span>
                <span className="app-shell__nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="app-shell__account">
          <div className="app-shell__account-user">
            <span className="app-shell__account-badge">{userInitials}</span>
            <div className="app-shell__account-data">
              <span className="app-shell__account-name">{user?.name ?? 'Admin User'}</span>
              <span className="app-shell__account-email">{user?.email ?? 'admin@datapulse.com'}</span>
            </div>
          </div>
          <button type="button" onClick={signOut} className="app-shell__signout">
            <LogOut className="app-shell__signout-icon" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className={mainClasses}>
        <div className="app-shell__content">
          <div className="app-shell__header">
            <button
              type="button"
              onClick={toggleNav}
              className="app-shell__toggle"
              aria-label={navOpen ? 'Ocultar menú de navegación' : 'Mostrar menú de navegación'}
              aria-expanded={navOpen}
            >
              <Menu className="app-shell__toggle-icon" />
            </button>
            <h2 className="app-shell__title">{sectionTitle}</h2>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
