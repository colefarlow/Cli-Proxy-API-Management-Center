import type { ReactNode } from 'react';

export function Glyph({ name, size = 21 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    pencil: (
      <>
        <path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-4L4 15Z" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
      </>
    ),
    accounts: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="3" />
        <circle cx="9" cy="11" r="2" />
        <path d="M5.5 17c0-4 7-4 7 0M16 10h2m-2 4h2" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5" />
      </>
    ),
    connect: (
      <>
        <path d="m9 15 6-6m-8 4-2 2a4 4 0 0 0 6 6l3-3m-4-12 3-3a4 4 0 0 1 6 6l-2 2" />
      </>
    ),
    routing: (
      <>
        <circle cx="5" cy="6" r="2" />
        <circle cx="19" cy="6" r="2" />
        <circle cx="12" cy="19" r="2" />
        <path d="M5 8v3h14V8m-7 3v6" />
      </>
    ),
    settings: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="3" fill="currentColor" stroke="none" />
        <circle cx="16" cy="17" r="3" fill="currentColor" stroke="none" />
      </>
    ),
    chart: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <path d="M7 15v2m5-7v7m5-11v11" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 4v5c0 5-8 9-8 9s-8-4-8-9V7Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6 7a7 7 0 0 1 12-2l2 3M4 16l2 3a7 7 0 0 0 12-2" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="7.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    system: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8m-4-4v4" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.settings}
    </svg>
  );
}
