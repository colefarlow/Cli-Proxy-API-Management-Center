import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainRoutes } from '@/router/MainRoutes';
import { useAuthStore } from '@/stores';
import { triggerHeaderRefresh } from '@/hooks/useHeaderRefresh';
import { useAtelierSnapshot } from './useAtelierSnapshot';
import { Glyph } from './Glyph';
import { SnapshotContext } from './AtelierContext';
import { recommendationChecks } from './atelierData';
import { navigationSection, setupHealth } from './dailyView';
import './atelier.scss';

const destinations = [
  ['/', 'home', 'dashboard'],
  ['/auth-files', 'accounts', 'accounts'],
  ['/advanced', 'settings', 'advanced'],
] as const;
const routeTitles: Record<string, string> = {
  '/quota': 'quota',
  '/oauth': 'connect',
  '/routing': 'routing',
  '/ai-providers': 'providers',
  '/setup': 'setup',
  '/config': 'configuration',
  '/logs': 'activity',
  '/system': 'system',
  '/advanced': 'advanced',
};

export function AtelierLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const snapshot = useAtelierSnapshot();
  const [query, setQuery] = useState('');
  const version = useAuthStore((state) => state.serverVersion);
  const section = navigationSection(location.pathname);
  const title = routeTitles[location.pathname] ?? section;
  const health = setupHealth(
    recommendationChecks(snapshot.config, snapshot.accounts, snapshot.helper),
    Boolean(snapshot.observedAt),
    snapshot.error
  );
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
          <Link to="/" className="atelier-brand" aria-label="Proxy Atelier">
            <span className="atelier-mark">
              <svg width="25" height="28" viewBox="0 0 29 32" aria-hidden="true">
                <path d="m3 25 10-20h5L8 25Zm9 0L22 5l4 8-6 12Z" fill="#b9e8bc" />
              </svg>
            </span>
            <span>
              Proxy
              <br />
              Atelier
            </span>
          </Link>
          <nav>
            {destinations.map(([path, icon, label]) => (
              <Link
                key={path}
                to={path}
                className={`atelier-nav ${section === label ? 'selected' : ''}`}
                aria-current={section === label ? 'page' : undefined}
              >
                <Glyph name={icon} size={19} />
                <span>{t(`atelier.${label}`)}</span>
              </Link>
            ))}
          </nav>
          <div className="atelier-rail-bottom">
            <span className="atelier-sidebar-note">{t('atelier.desktop_control')}</span>
            <span>{version ?? 'CLIProxyAPI'}</span>
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
              <Glyph name="search" size={18} />
            </div>
            <div className="atelier-header-right">
              <Link
                to="/setup"
                className={`atelier-health ${health}`}
                title={t('atelier.health_details')}
              >
                <Glyph name={health === 'ready' ? 'check' : 'shield'} size={17} />
                {t(`atelier.health_${health}`)}
              </Link>
              {window.proxyAtelier && (
                <label className="atelier-host-picker" title={t('atelier.viewing_help')}>
                  <span>{t('atelier.viewing')}</span>
                  <select
                    aria-label={t('atelier.select_host')}
                    value={window.proxyAtelier.host}
                    onChange={(event) => window.proxyAtelier?.switchHost(event.target.value)}
                  >
                    <option value="macbook">MacBook</option>
                    <option value="linuxbox2">LinuxBox2</option>
                  </select>
                </label>
              )}
              <button
                className="atelier-icon-button"
                disabled={snapshot.loading}
                onClick={() => {
                  void Promise.allSettled([snapshot.refresh(), triggerHeaderRefresh()]);
                }}
                title={t('atelier.refresh')}
                aria-label={t('atelier.refresh')}
              >
                <Glyph name="refresh" size={18} />
              </button>
            </div>
          </header>
          <main className="atelier-main content">
            {snapshot.error && (
              <div role="alert" className="atelier-warning">
                {t('atelier.connection_error')}
              </div>
            )}
            <MainRoutes />
          </main>
          <footer className="atelier-footer">
            <span>{t('atelier.independent')}</span>
            <span>{t('atelier.viewing_help')}</span>
          </footer>
        </div>
      </div>
    </SnapshotContext.Provider>
  );
}
