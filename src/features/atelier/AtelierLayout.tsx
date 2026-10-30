import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainRoutes } from '@/router/MainRoutes';
import { useAuthStore } from '@/stores';
import { useAtelierSnapshot } from './useAtelierSnapshot';
import { Glyph } from './Glyph';
import { SnapshotContext } from './AtelierContext';
import { useInterfaceStore } from './interfaceStore';
import { triggerHeaderRefresh } from '@/hooks/useHeaderRefresh';
import './atelier.scss';

const destinations = [
  ['/', 'home', 'dashboard'],
  ['/auth-files', 'accounts', 'accounts'],
  ['/quota', 'layers', 'quota'],
  ['/oauth', 'connect', 'connect'],
  ['/routing', 'routing', 'routing'],
  ['/ai-providers', 'layers', 'providers'],
  ['/setup', 'shield', 'setup'],
  ['/config', 'settings', 'configuration'],
] as const;

export function AtelierLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const snapshot = useAtelierSnapshot();
  const [query, setQuery] = useState('');
  const version = useAuthStore((state) => state.serverVersion);
  const title =
    destinations.find(([path]) => path === location.pathname)?.[2] ??
    (location.pathname === '/logs' ? 'activity' : 'system');
  const refresh = snapshot.refresh;
  useEffect(() => {
    const handler = () => {
      void refresh();
    };
    window.addEventListener('atelier-refresh', handler);
    return () => window.removeEventListener('atelier-refresh', handler);
  }, [refresh]);
  return (
    <SnapshotContext.Provider value={{ ...snapshot, query }}>
      <div className="atelier-app">
        <aside className="atelier-rail" aria-label={t('atelier.navigation')}>
          <NavLink to="/" className="atelier-mark" title="Proxy Atelier" aria-label="Proxy Atelier">
            <svg width="29" height="32" viewBox="0 0 29 32" aria-hidden="true">
              <path d="m3 25 10-20h5L8 25Zm9 0L22 5l4 8-6 12Z" fill="#b9e8bc" />
            </svg>
          </NavLink>
          <nav>
            {destinations.map(([path, icon, label]) => (
              <NavLink
                end={path === '/'}
                key={path}
                to={path}
                title={t(`atelier.${label}`)}
                aria-label={t(`atelier.${label}`)}
                className={({ isActive }) => `atelier-nav ${isActive ? 'selected' : ''}`}
              >
                <Glyph name={icon} />
              </NavLink>
            ))}
          </nav>
          <div className="atelier-rail-bottom">
            <NavLink
              to="/logs"
              className="atelier-nav"
              title={t('atelier.activity')}
              aria-label={t('atelier.activity')}
            >
              <Glyph name="chart" />
            </NavLink>
            <NavLink
              to="/system"
              className="atelier-nav"
              title={t('atelier.system')}
              aria-label={t('atelier.system')}
            >
              <Glyph name="system" />
            </NavLink>
          </div>
        </aside>
        <div className="atelier-workspace">
          <header className="atelier-header">
            <h1>{t(`atelier.${title}`)}</h1>
            <div className="atelier-search">
              <input
                value={query}
                placeholder={t('atelier.search')}
                aria-label={t('atelier.search')}
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (location.pathname !== '/') void navigate('/');
                }}
              />
              <Glyph name="search" size={20} />
            </div>
            <div className="atelier-header-right">
              <span className={`atelier-connection ${snapshot.error ? 'offline' : ''}`}>
                <i />
                {t(snapshot.error ? 'atelier.unreachable' : 'atelier.connected')}
              </span>
              {window.proxyAtelier && (
                <select
                  aria-label={t('atelier.select_host')}
                  value={window.proxyAtelier.host}
                  onChange={(event) => window.proxyAtelier?.switchHost(event.target.value)}
                >
                  <option value="macbook">MacBook</option>
                  <option value="linuxbox2">LinuxBox2</option>
                </select>
              )}
              <button
                className={`atelier-icon-button ${snapshot.loading ? 'refreshing' : ''}`}
                disabled={snapshot.loading}
                onClick={() => {
                  void Promise.allSettled([snapshot.refresh(), triggerHeaderRefresh()]);
                }}
                title={t('atelier.refresh')}
                aria-label={t('atelier.refresh')}
              >
                <Glyph name="refresh" size={19} />
              </button>
            </div>
          </header>
          <main className="atelier-main content" data-account-search={query.toLowerCase()}>
            {snapshot.error && (
              <div role="alert" className="atelier-warning">
                {t('atelier.connection_error')}
              </div>
            )}
            <MainRoutes />
          </main>
          <footer className="atelier-footer">
            <button
              className="atelier-original-button"
              onClick={() => useInterfaceStore.getState().setOriginal(true)}
            >
              {t('atelier.original_controls')}
            </button>
            <span>
              PROXY ATELIER <em>/</em> {version ?? 'CLIProxyAPI'}
            </span>
            <span>{t('atelier.independent')}</span>
          </footer>
        </div>
      </div>
    </SnapshotContext.Provider>
  );
}
