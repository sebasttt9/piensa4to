import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Activity, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appNavigation } from '../../lib/navigation';
import './AppShell.css';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut, hasRole } = useAuth();
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
  const isCollapsedDesktop = isDesktop && !navOpen;

  const asideClasses = useMemo(() => {
    const classes = ['app-shell__aside'];
    if (navOpen) {
      classes.push('app-shell__aside--open');
    }
    if (!navOpen && isDesktop) {
      classes.push('app-shell__aside--collapsed');
    }
    return classes.join(' ');
  }, [isDesktop, navOpen]);

  const mainClasses = useMemo(() => {
    const classes = ['app-shell__main'];
    if (navOpen) {
      classes.push('app-shell__main--align-right');
    } else {
      classes.push('app-shell__main--centered');
    }
    if (isDesktop && navOpen) {
      classes.push('app-shell__main--with-nav');
    }
    if (!isDesktop && navOpen) {
      classes.push('app-shell__main--shifted');
    }
    if (isDesktop && !navOpen) {
      classes.push('app-shell__main--collapsed-nav');
    }
    return classes.join(' ');
  }, [isDesktop, navOpen]);
  const asideHidden = !navOpen && !isDesktop;
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

  const navigationItems = useMemo(
    () => appNavigation.filter((item) => !item.minRole || hasRole(item.minRole)),
    [hasRole],
  );

  const contentClasses = useMemo(() => {
    const classes = ['app-shell__content'];
    if (navOpen) {
      classes.push('app-shell__content--right');
    } else {
      classes.push('app-shell__content--centered');
    }
    return classes.join(' ');
  }, [navOpen]);

  const headerClasses = useMemo(() => {
    const classes = ['app-shell__header'];
    if (navOpen) {
      classes.push('app-shell__header--right');
    } else {
      classes.push('app-shell__header--centered');
    }
    return classes.join(' ');
  }, [navOpen]);

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

      {!navOpen && !isDesktop && (
        <button
          type="button"
          aria-label="Mostrar panel de navegación"
          className="app-shell__toggle app-shell__floating-toggle app-shell__toggle--inactive"
          onClick={toggleNav}
        >
          <ChevronRight className="app-shell__toggle-icon" />
        </button>
      )}

      <aside
        className={asideClasses}
        aria-hidden={asideHidden}
      >
        <div className="app-shell__aside-top">
          <div className="app-shell__brand">
            <div className="app-shell__brand-badge">
              <Activity className="app-shell__brand-icon" strokeWidth={2.5} />
            </div>
            <div className="app-shell__brand-copy">
              <span className="app-shell__brand-title">DataPulse</span>
              <span className="app-shell__brand-subtitle">Business Analytics</span>
            </div>
          </div>
          <button
            type="button"
            aria-label={navOpen ? 'Ocultar panel de navegación' : 'Mostrar panel de navegación'}
            className={`app-shell__toggle app-shell__aside-toggle ${!navOpen ? 'app-shell__toggle--inactive' : ''}`.trim()}
            onClick={toggleNav}
          >
            {navOpen ? (
              <ChevronLeft className="app-shell__toggle-icon" />
            ) : (
              <ChevronRight className="app-shell__toggle-icon" />
            )}
          </button>
        </div>

        <nav className="app-shell__nav">
          {navigationItems.map((item) => {
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
            {!isCollapsedDesktop && (
              <div className="app-shell__account-data">
                <span className="app-shell__account-name">{user?.name ?? 'Admin User'}</span>
                <span className="app-shell__account-email">{user?.email ?? 'admin@datapulse.com'}</span>
                <span className="app-shell__account-role">{user?.role?.toUpperCase()}</span>
              </div>
            )}
          </div>
          {!isCollapsedDesktop ? (
            <button type="button" onClick={signOut} className="app-shell__signout">
              <LogOut className="app-shell__signout-icon" />
              Cerrar sesión
            </button>
          ) : (
            <button
              type="button"
              onClick={signOut}
              className="app-shell__signout-icon-only"
              aria-label="Cerrar sesión"
            >
              <LogOut className="app-shell__signout-icon" />
            </button>
          )}
        </div>
      </aside>

      <main className={mainClasses}>
        <div className={contentClasses}>
          <div className={headerClasses} />
          {children}
        </div>
      </main>
    </div>
  );
}
