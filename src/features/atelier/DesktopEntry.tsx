import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useLanguageStore, useThemeStore } from '@/stores';

let startup: Promise<void> | null = null;
function connect() {
  if (!startup) {
    useLanguageStore.getState().setLanguage('en');
    useThemeStore.getState().setTheme('white');
    startup = useAuthStore.getState().login({
      apiBase:
        window.proxyAtelier?.host === 'linuxbox2'
          ? 'http://linuxbox2:8317'
          : 'http://127.0.0.1:8317',
      // Public transport marker, not an authentication credential. Native code authenticates.
      managementKey: 'native-managed',
      rememberPassword: false,
    });
  }
  return startup;
}

export function DesktopEntry({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!window.proxyAtelier) return;
    let mounted = true;
    void connect()
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch(() => {
        if (mounted) setFailed(true);
      });
    return () => {
      mounted = false;
    };
  }, [attempt]);
  if (!window.proxyAtelier || ready) return children;
  return (
    <div className="atelier-boot">
      <strong>Proxy Atelier</strong>
      <p>{t(failed ? 'atelier.boot_error' : 'atelier.loading')}</p>
      {failed && (
        <>
          <button
            onClick={() => {
              startup = null;
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            {t('atelier.retry')}
          </button>
          <button
            onClick={() =>
              window.proxyAtelier?.switchHost(
                window.proxyAtelier.host === 'macbook' ? 'linuxbox2' : 'macbook'
              )
            }
          >
            {t('atelier.other_host')}
          </button>
        </>
      )}
    </div>
  );
}
