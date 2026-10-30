import { useEffect } from 'react';
import { Outlet, RouterProvider, createHashRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { NotificationContainer } from '@/components/common/NotificationContainer';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { LoginRevealVeil } from '@/components/common/LoginRevealVeil';
import { AtelierLayout as MainLayout } from '@/features/atelier/AtelierLayout';
import { MainLayout as OriginalLayout } from '@/components/layout/MainLayout';
import { useInterfaceStore } from '@/features/atelier/interfaceStore';
import { useTranslation } from 'react-i18next';
import { triggerHeaderRefresh } from '@/hooks/useHeaderRefresh';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { useLanguageStore, useThemeStore } from '@/stores';

function RootShell() {
  return (
    <>
      <NotificationContainer />
      <ConfirmationModal />
      <Outlet />
      <LoginRevealVeil />
    </>
  );
}

function ManagementLayout() {
  const original = useInterfaceStore((state) => state.original);
  const { t } = useTranslation();
  return original ? (
    <>
      <OriginalLayout />
      <button
        className="atelier-return"
        onClick={() => useInterfaceStore.getState().setOriginal(false)}
      >
        {t('atelier.back_to_atelier')}
      </button>
    </>
  ) : (
    <MainLayout />
  );
}

// DEV-only design previews: statically false in production builds, so the
// branch and its dynamic import are dropped from the single-file bundle.
const devPreviewRoutes = import.meta.env.DEV
  ? [
      {
        path: '/__preview/quota-tiers',
        HydrateFallback: () => null,
        lazy: async () => {
          const { QuotaTierPreview } = await import('@/features/quota/preview/QuotaTierPreview');
          return { Component: QuotaTierPreview };
        },
      },
    ]
  : [];

const router = createHashRouter([
  {
    element: <RootShell />,
    children: [
      ...devPreviewRoutes,
      { path: '/login', element: <LoginPage /> },
      {
        path: '/*',
        element: (
          <ProtectedRoute>
            <ManagementLayout />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

function App() {
  const original = useInterfaceStore((state) => state.original);
  useEffect(() => {
    document.documentElement.dataset.atelierView = original ? 'original' : 'atelier';
  }, [original]);
  useEffect(() => {
    const handler = (event: Event) =>
      useInterfaceStore.getState().setOriginal(Boolean((event as CustomEvent).detail));
    window.addEventListener('atelier-interface', handler);
    return () => window.removeEventListener('atelier-interface', handler);
  }, []);
  useEffect(() => {
    const handler = () => {
      void triggerHeaderRefresh();
    };
    window.addEventListener('atelier-refresh', handler);
    return () => window.removeEventListener('atelier-refresh', handler);
  }, []);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  useEffect(() => {
    const cleanupTheme = initializeTheme();
    return cleanupTheme;
  }, [initializeTheme]);

  useEffect(() => {
    setLanguage(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅用于首屏同步 i18n 语言

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return <RouterProvider router={router} />;
}

export default App;
