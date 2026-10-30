import type { SetupCheck } from './atelierData';

export function navigationSection(path: string): 'dashboard' | 'accounts' | 'advanced' {
  if (path === '/' || path === '/dashboard') return 'dashboard';
  if (path === '/auth-files' || path.startsWith('/auth-files/')) return 'accounts';
  return 'advanced';
}

export function setupHealth(checks: SetupCheck[], observed: boolean, error: boolean) {
  if (error) return 'unavailable';
  if (!observed) return 'checking';
  return checks.length > 0 && checks.every((check) => check.state === 'on') ? 'ready' : 'attention';
}

type Countdown =
  { kind: 'unknown' | 'due' } | { kind: 'future'; days: number; hours: number; minutes: number };
export function resetCountdown(value: string | null, now = Date.now()): Countdown {
  const reset = value ? Date.parse(value) : NaN;
  if (!Number.isFinite(reset) || !Number.isFinite(now)) return { kind: 'unknown' };
  if (reset <= now) return { kind: 'due' };
  const minutes = Math.ceil((reset - now) / 60000);
  return {
    kind: 'future',
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    minutes: minutes % 60,
  };
}
