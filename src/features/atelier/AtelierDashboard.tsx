import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Glyph } from './Glyph';
import { useAtelier } from './AtelierContext';
import { accountIdentity, useAccountNames } from './accountNames';
import { RenameAccountButton } from './RenameAccountButton';
import { summarizeAccounts, type QuotaWindow } from './atelierData';
import { resetCountdown } from './dailyView';

const number = (value: number) => new Intl.NumberFormat().format(value);
function Allowance({ value, weekly = false }: { value: QuotaWindow | null; weekly?: boolean }) {
  return (
    <div className={`atelier-allowance ${weekly ? 'weekly' : ''}`}>
      <strong>{value ? `${Math.round(value.remaining)}%` : '—'}</strong>
      {weekly && (
        <div className="atelier-quota-track" aria-hidden="true">
          <div style={{ width: `${value?.remaining ?? 0}%` }} />
        </div>
      )}
    </div>
  );
}
function ResetTime({ value, now }: { value: string | null; now: number }) {
  const { t } = useTranslation();
  const remaining = resetCountdown(value, now);
  const exact = value
    ? new Date(value).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : undefined;
  const label =
    remaining.kind === 'future'
      ? remaining.days > 0
        ? t('atelier.reset_days', remaining)
        : remaining.hours > 0
          ? t('atelier.reset_hours', remaining)
          : t('atelier.reset_minutes', remaining)
      : t(remaining.kind === 'due' ? 'atelier.reset_checking' : 'atelier.quota_not_reported');
  return (
    <time className={`atelier-reset ${remaining.kind}`} dateTime={value ?? undefined} title={exact}>
      <strong>{label}</strong>
      {remaining.kind === 'future' && <small>{t('atelier.until_reset')}</small>}
    </time>
  );
}

export function AtelierDashboard() {
  const { t } = useTranslation();
  const { accounts, quotas, observedAt, loading, query } = useAtelier();
  const [provider, setProvider] = useState('all');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const names = useAccountNames((state) => state.names);
  const summary = summarizeAccounts(accounts);
  const claude = accounts.filter(
    (account) => (account.provider ?? account.type) === 'claude' && !account.disabled
  );
  const remaining = claude
    .map((account) => quotas[account.name]?.weekly?.remaining)
    .filter((value): value is number => value !== undefined && value !== null);
  const average =
    remaining.length === claude.length && claude.length
      ? remaining.reduce((sum, value) => sum + value, 0) / remaining.length
      : null;
  const sorted = [...accounts].sort(
    (a, b) =>
      Number((b.provider ?? b.type) === 'claude') - Number((a.provider ?? a.type) === 'claude') ||
      (Number(b.priority) || 0) - (Number(a.priority) || 0) ||
      a.name.localeCompare(b.name)
  );
  const filtered = sorted.filter(
    (account) =>
      (provider === 'all' || (account.provider ?? account.type) === provider) &&
      `${names[accountIdentity(account)] ?? ''} ${account.email ?? ''} ${account.name} ${account.provider ?? account.type}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  return (
    <div className="atelier-dashboard">
      <section className="atelier-overview">
        <div>
          <h2>{t('atelier.allowance_heading')}</h2>
          <p>
            {observedAt
              ? t('atelier.accounts_connected', { count: summary.active })
              : t('atelier.loading')}
          </p>
        </div>
        <div className="atelier-capacity">
          <div>
            <strong>{average === null ? '—' : `${Math.round(average)}%`}</strong>
            <span>{t('atelier.capacity_remaining')}</span>
          </div>
          <div className="atelier-spectrum" aria-hidden="true">
            <div style={{ width: `${average ?? 0}%` }} />
          </div>
          <small>{t('atelier.average_note')}</small>
        </div>
      </section>
      <section className="atelier-accounts-panel">
        <div className="atelier-section-heading">
          <h2>{t('atelier.your_accounts')}</h2>
          <div className="atelier-segments" aria-label={t('atelier.filter_accounts')}>
            {['all', 'claude', 'codex'].map((id) => (
              <button
                key={id}
                aria-pressed={provider === id}
                className={provider === id ? 'active' : ''}
                onClick={() => setProvider(id)}
              >
                {id === 'all' ? t('atelier.all') : id === 'claude' ? 'Claude' : 'Codex'}
              </button>
            ))}
          </div>
        </div>
        <div className="atelier-account-columns">
          <span>{t('atelier.account_label')}</span>
          <span>{t('atelier.short_allowance')}</span>
          <span>{t('atelier.weekly_allowance')}</span>
          <span>{t('atelier.weekly_reset')}</span>
          <span />
        </div>
        <div className="atelier-account-list">
          {filtered.map((account) => {
            const kind = String(account.provider ?? account.type);
            const quota = quotas[account.name];
            const email = account.email || account.name;
            const title =
              names[accountIdentity(account)] ??
              (kind === 'codex'
                ? t('atelier.chatgpt_pro')
                : kind !== 'claude'
                  ? email
                  : email.endsWith('@alexandergrading.com')
                    ? t('atelier.ag_workspace')
                    : email.includes('@yahoo.')
                      ? t('atelier.personal_yahoo')
                      : t('atelier.personal_google'));
            return (
              <div
                key={account.name}
                className={`atelier-account-row ${account.disabled ? 'disabled' : ''}`}
              >
                <div className="atelier-account-identity">
                  <div className={`atelier-avatar ${kind}`} aria-hidden="true">
                    {kind === 'codex'
                      ? '◎'
                      : kind === 'claude'
                        ? '✳'
                        : kind.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="atelier-account-name">
                      <strong title={title}>{title}</strong>
                      <RenameAccountButton file={account} />
                    </div>
                    <small title={email}>{email}</small>
                  </div>
                </div>
                <Allowance value={quota?.short ?? null} />
                <Allowance value={quota?.weekly ?? null} weekly />
                <ResetTime value={quota?.weekly?.resetsAt ?? null} now={now} />
                <Link
                  to="/auth-files"
                  className="atelier-row-action"
                  title={t('atelier.manage_account')}
                  aria-label={`${t('atelier.manage_account')} ${title}`}
                >
                  <Glyph name="arrow" size={18} />
                </Link>
                {quota?.error && (
                  <span className="atelier-quota-error" role="status">
                    {t('atelier.quota_unavailable')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {!filtered.length && (
          <div className="atelier-empty">
            {t(
              loading
                ? 'atelier.loading'
                : accounts.length
                  ? 'atelier.no_matches'
                  : 'atelier.no_accounts'
            )}
          </div>
        )}
        <div className="atelier-table-foot">
          <span>{t('atelier.priority_note')}</span>
          <Link to="/quota">
            {t('atelier.detailed_quota')}
            <Glyph name="arrow" size={16} />
          </Link>
        </div>
      </section>
      <div className="atelier-dashboard-bottom">
        <div className="atelier-observation-note">
          {observedAt
            ? `${t('atelier.updated')} ${observedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
            : t('atelier.loading')}
          <span>·</span>
          {t('atelier.refresh_interval')}
        </div>
        <details className="atelier-traffic">
          <summary>{t('atelier.request_activity')}</summary>
          <div>
            <span>
              {t('atelier.requests_served')}
              <strong>{observedAt ? number(summary.total) : '—'}</strong>
            </span>
            <span>
              {t('atelier.success_rate')}
              <strong>
                {summary.successRate === null ? '—' : `${summary.successRate.toFixed(1)}%`}
              </strong>
            </span>
          </div>
        </details>
      </div>
    </div>
  );
}
