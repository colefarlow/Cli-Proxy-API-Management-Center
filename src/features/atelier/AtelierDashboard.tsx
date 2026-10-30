import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Glyph } from './Glyph';
import { useAtelier } from './AtelierContext';
import { accountIdentity, useAccountNames } from './accountNames';
import { RenameAccountButton } from './RenameAccountButton';
import { recommendationChecks, summarizeAccounts, type QuotaWindow } from './atelierData';

const number = (value: number) => new Intl.NumberFormat().format(value);
function Ring({ value }: { value: number | null }) {
  return (
    <svg className="atelier-ring" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="14" fill="none" stroke="#eeedf2" strokeWidth="4" />
      <circle
        cx="18"
        cy="18"
        r="14"
        fill="none"
        stroke="#c7b8e7"
        strokeWidth="4"
        strokeDasharray={`${(value ?? 0) * 0.88} 88`}
        transform="rotate(-90 18 18)"
        strokeLinecap="round"
      />
    </svg>
  );
}
function Allowance({ value }: { value: QuotaWindow | null }) {
  return (
    <div className="atelier-allowance">
      <Ring value={value?.remaining ?? null} />
      <strong>{value ? `${Math.round(value.remaining)}%` : '—'}</strong>
    </div>
  );
}

export function AtelierDashboard() {
  const { t } = useTranslation();
  const { accounts, config, helper, quotas, observedAt, loading, query } = useAtelier();
  const [provider, setProvider] = useState('all');
  const names = useAccountNames((state) => state.names);
  const summary = summarizeAccounts(accounts);
  const checks = recommendationChecks(config, accounts, helper);
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
  const nextReset = claude
    .map((account) => quotas[account.name]?.weekly?.resetsAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(a) - Date.parse(b))[0];
  const allChecks = checks.filter((check) => check.state === 'on').length;
  const providers = new Set(
    accounts
      .filter((account) => !account.disabled)
      .map((account) => account.provider ?? account.type)
  ).size;
  return (
    <div className="atelier-dashboard">
      <section className="atelier-hero">
        <div className="atelier-account-total">
          <span className="atelier-eyebrow">{t('atelier.your_inference')}</span>
          <div className="atelier-big-number">
            {observedAt ? summary.active.toString().padStart(2, '0') : '—'}
          </div>
          <p>{t('atelier.connected_accounts')}</p>
          <span className="atelier-muted">
            {claude.length} Claude <span className="atelier-middle-dot">·</span>{' '}
            {
              accounts.filter(
                (account) => (account.provider ?? account.type) === 'codex' && !account.disabled
              ).length
            }{' '}
            Codex
          </span>
        </div>
        <div className="atelier-capacity">
          <div className="atelier-capacity-heading">
            <strong>{average === null ? '—' : `${Math.round(average)}%`}</strong>
            <span>{t('atelier.capacity_remaining')}</span>
            <span className="atelier-live-label">
              <i />
              {t('atelier.live_quota')}
            </span>
          </div>
          <div className="atelier-spectrum">
            <div className="atelier-spectrum-fill" style={{ width: `${average ?? 0}%` }} />
            <span className="atelier-spectrum-caption">{t('atelier.weekly_allowance')}</span>
            {average !== null && (
              <span className="atelier-spectrum-marker" style={{ left: `${average}%` }} />
            )}
          </div>
          <div className="atelier-meter-note">
            <span>{t('atelier.average_note')}</span>
            <span>
              {nextReset
                ? `${t('atelier.next_reset')} ${new Date(nextReset).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                : t('atelier.reading_quota')}
            </span>
          </div>
        </div>
      </section>
      <section className="atelier-stats">
        <div>
          <span>{t('atelier.requests_served')}</span>
          <div>
            <span className="atelier-stat-symbol coral">↗</span>
            <strong>{observedAt ? number(summary.total) : '—'}</strong>
            <small>{t('atelier.since_start')}</small>
          </div>
        </div>
        <div>
          <span>{t('atelier.provider_pools')}</span>
          <div>
            <span className="atelier-stat-symbol lavender">≋</span>
            <strong>{observedAt ? String(providers).padStart(2, '0') : '—'}</strong>
            <small>
              Claude <span className="atelier-middle-dot">·</span> Codex
            </small>
          </div>
        </div>
        <div>
          <span>{t('atelier.success_rate')}</span>
          <div>
            <span className="atelier-stat-symbol mint">↑</span>
            <strong>
              {summary.successRate === null ? '—' : `${summary.successRate.toFixed(1)}%`}
            </strong>
            <small className="green">
              {number(summary.success)} {t('atelier.successful')}
            </small>
          </div>
        </div>
      </section>
      <section className="atelier-lower-grid">
        <div className="atelier-accounts-panel">
          <div className="atelier-section-heading">
            <h2>{t('atelier.your_accounts')}</h2>
            <span>
              {accounts.length} {t('atelier.total')}
            </span>
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
            <span>{t('atelier.account')}</span>
            <span>{t('atelier.five_hour')}</span>
            <span>{t('atelier.weekly_left')}</span>
            <span>{t('atelier.resets')}</span>
          </div>
          <div className="atelier-account-list">
            {sorted
              .filter(
                (account) =>
                  (provider === 'all' || (account.provider ?? account.type) === provider) &&
                  `${names[accountIdentity(account)] ?? ''} ${account.email ?? ''} ${account.name} ${account.provider ?? account.type}`
                    .toLowerCase()
                    .includes(query.toLowerCase())
              )
              .map((account) => {
                const kind = String(account.provider ?? account.type);
                const quota = quotas[account.name];
                const email = account.email || account.name;
                const title =
                  names[accountIdentity(account)] ??
                  (kind === 'codex'
                    ? t('atelier.chatgpt_pro')
                    : email.endsWith('@alexandergrading.com')
                      ? t('atelier.ag_workspace')
                      : email.includes('@yahoo.')
                        ? t('atelier.personal_yahoo')
                        : t('atelier.personal_google'));
                return (
                  <div
                    key={account.name}
                    className="atelier-account-row"
                    data-searchable={`${title} ${email} ${kind}`.toLowerCase()}
                  >
                    <div className="atelier-account-identity">
                      <div className={`atelier-avatar ${kind}`} aria-hidden="true">
                        {kind === 'codex' ? '◎' : '✳'}
                      </div>
                      <div>
                        <strong>{title}</strong>
                        <RenameAccountButton file={account} />
                        <small title={email}>{email}</small>
                      </div>
                    </div>
                    <Allowance value={quota?.short ?? null} />
                    <Allowance value={quota?.weekly ?? null} />
                    <div className="atelier-reset">
                      <strong>
                        {quota?.weekly?.resetsAt
                          ? new Date(quota.weekly.resetsAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </strong>
                      <small>
                        {quota?.error
                          ? t('atelier.quota_unavailable')
                          : quota?.weekly?.resetsAt
                            ? new Date(quota.weekly.resetsAt).toLocaleTimeString(undefined, {
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : t('atelier.reading_quota')}
                      </small>
                    </div>
                    <Link
                      to="/auth-files"
                      className="atelier-row-action"
                      title={t('atelier.manage_account')}
                      aria-label={`${t('atelier.manage_account')} ${title}`}
                    >
                      <Glyph name="arrow" size={17} />
                    </Link>
                  </div>
                );
              })}
          </div>
          {!accounts.length && (
            <div className="atelier-empty">
              {t(loading ? 'atelier.loading' : 'atelier.no_accounts')}
            </div>
          )}
          <div className="atelier-table-foot">
            <span>
              <i />
              {t('atelier.priority_note')}
            </span>
            <Link to="/quota">
              {t('atelier.detailed_quota')} <Glyph name="arrow" size={15} />
            </Link>
          </div>
        </div>
        <aside className="atelier-setup-panel">
          <div className="atelier-section-heading">
            <h2>
              {t(allChecks === checks.length ? 'atelier.running_smoothly' : 'atelier.setup_status')}
            </h2>
            <Link to="/setup" title={t('atelier.setup')} aria-label={t('atelier.setup')}>
              <Glyph name="settings" size={20} />
            </Link>
          </div>
          <div className="atelier-flower" aria-hidden="true">
            <div className="atelier-flower-glow" />
            {['affinity', 'websockets', 'priority', 'subagents', 'cooldown', 'strategy'].map(
              (id, index) => (
                <div key={id} className={`atelier-petal petal-${index}`}>
                  <strong>
                    {t(
                      checks.find((check) => check.id === id)?.state === 'on'
                        ? 'atelier.on'
                        : 'atelier.check'
                    )}
                  </strong>
                  <span>{t(`atelier.short_${id}`)}</span>
                </div>
              )
            )}
            <div className="atelier-flower-core">
              <Glyph name="shield" size={20} />
            </div>
          </div>
          <div className="atelier-setup-caption">
            <strong>
              {allChecks} / {checks.length} {t('atelier.settings_verified')}
            </strong>
            <p>{t('atelier.safe_to_close')}</p>
            <Link className="atelier-text-link" to="/setup">
              {t('atelier.review_setup')} <Glyph name="arrow" size={16} />
            </Link>
          </div>
        </aside>
      </section>
      <div className="atelier-observation-note">
        {observedAt
          ? `${t('atelier.updated')} ${observedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
          : t('atelier.loading')}
        <span>·</span>
        {t('atelier.refresh_interval')}
      </div>
    </div>
  );
}
