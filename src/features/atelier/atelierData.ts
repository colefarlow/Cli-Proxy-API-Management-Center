import type { AuthFileItem } from '@/types/authFile';

export type RecordValue = Record<string, unknown>;
export const record = (value: unknown): RecordValue =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as RecordValue)
    : {};

export interface QuotaWindow {
  remaining: number;
  resetsAt: string | null;
}
export interface AccountQuota {
  weekly: QuotaWindow | null;
  short: QuotaWindow | null;
  error: boolean;
}
export interface HelperStatus {
  enabled: boolean;
  lastRun: string | null;
  lastStatus: string | null;
}
export interface SetupCheck {
  id: string;
  state: 'on' | 'off' | 'unknown';
  value: string;
}

export function quotaWindow(value: unknown): QuotaWindow | null {
  const data = record(value);
  const used = data.utilization ?? data.used_percent;
  if (typeof used !== 'number' || !Number.isFinite(used) || used < 0) return null;
  const reset =
    data.resets_at ??
    (typeof data.reset_at === 'number' ? new Date(data.reset_at * 1000).toISOString() : null);
  return {
    remaining: Math.max(0, Math.min(100, 100 - used)),
    resetsAt: typeof reset === 'string' && Number.isFinite(Date.parse(reset)) ? reset : null,
  };
}

export function codexQuota(rate: RecordValue): Pick<AccountQuota, 'weekly' | 'short'> {
  const windows = [record(rate.primary_window), record(rate.secondary_window)];
  return {
    weekly: quotaWindow(windows.find((window) => window.limit_window_seconds === 604800)),
    short: quotaWindow(windows.find((window) => window.limit_window_seconds === 18000)),
  };
}

export function summarizeAccounts(accounts: AuthFileItem[]) {
  const success = accounts.reduce((total, account) => total + (account.successCount ?? 0), 0);
  const failures = accounts.reduce((total, account) => total + (account.failureCount ?? 0), 0);
  const total = success + failures;
  return {
    active: accounts.filter((account) => !account.disabled).length,
    total,
    success,
    failures,
    successRate: total ? (success / total) * 100 : null,
  };
}

export function recommendationChecks(
  config: RecordValue,
  accounts: AuthFileItem[],
  helper: HelperStatus | null
): SetupCheck[] {
  const routing = record(config.routing);
  const retries = record(routing.retry);
  const streaming = record(record(config.requests).streaming);
  const codex = accounts.filter(
    (account) => (account.provider ?? account.type) === 'codex' && !account.disabled
  );
  const check = (id: string, value: unknown, expected: unknown, display: string): SetupCheck => ({
    id,
    state: value === undefined ? 'unknown' : value === expected ? 'on' : 'off',
    value: display,
  });
  const booleanLabel = (value: unknown, invert = false) =>
    typeof value === 'boolean' ? ((invert ? !value : value) ? 'On' : 'Off') : '—';
  return [
    {
      id: 'priority',
      state:
        helper === null
          ? 'unknown'
          : helper.enabled &&
              ['updated', 'unchanged'].includes(helper.lastStatus ?? '') &&
              helper.lastRun !== null &&
              Date.now() - Date.parse(helper.lastRun) > -60_000 &&
              Date.now() - Date.parse(helper.lastRun) < 35 * 60_000
            ? 'on'
            : 'off',
      value: '15 min',
    },
    check('strategy', routing.strategy, 'fill-first', String(routing.strategy ?? '—')),
    check(
      'affinity',
      routing['session-affinity'] === undefined
        ? undefined
        : routing['session-affinity'] === true && routing['session-affinity-ttl'] === '12h',
      true,
      String(routing['session-affinity-ttl'] ?? '—')
    ),
    check(
      'subagents',
      routing['session-affinity-subagents'],
      true,
      booleanLabel(routing['session-affinity-subagents'])
    ),
    check(
      'rebind',
      routing['session-affinity-rebind-on'],
      'quota',
      String(routing['session-affinity-rebind-on'] ?? '—')
    ),
    {
      id: 'websockets',
      state: !codex.length
        ? 'unknown'
        : codex.every((account) => account.websockets === true)
          ? 'on'
          : 'off',
      value: 'Codex',
    },
    check(
      'cooldown',
      record(routing.cooldown)['disable-cooling'],
      false,
      booleanLabel(record(routing.cooldown)['disable-cooling'], true)
    ),
    check(
      'retries',
      retries['request-retry'] === undefined
        ? undefined
        : retries['request-retry'] === 2 && retries['max-retry-credentials'] === 3,
      true,
      `${String(retries['request-retry'] ?? '—')} / ${String(retries['max-retry-credentials'] ?? '—')}`
    ),
    check(
      'retrywait',
      retries['max-retry-interval'],
      10,
      `${String(retries['max-retry-interval'] ?? '—')}s`
    ),
    check(
      'heartbeat',
      streaming['keepalive-seconds'],
      15,
      `${String(streaming['keepalive-seconds'] ?? '—')}s`
    ),
    check(
      'bootstrap',
      streaming['bootstrap-retries'],
      1,
      String(streaming['bootstrap-retries'] ?? '—')
    ),
    check(
      'pretoken',
      streaming['send-keepalive-before-ft'],
      false,
      booleanLabel(streaming['send-keepalive-before-ft'])
    ),
  ];
}
