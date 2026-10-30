import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Glyph } from './Glyph';
import { useAtelier } from './AtelierContext';
import { recommendationChecks } from './atelierData';

export function AtelierSetup() {
  const { t } = useTranslation();
  const { config, accounts, helper } = useAtelier();
  const checks = recommendationChecks(config, accounts, helper);
  const verified = checks.filter((check) => check.state === 'on').length;
  return (
    <div className="atelier-setup-page">
      <div className="atelier-page-intro">
        <span className="atelier-eyebrow">{t('atelier.video_settings')}</span>
        <h2>{t('atelier.setup_heading')}</h2>
        <p>{t('atelier.setup_intro')}</p>
        <div className="atelier-verified-badge">
          <Glyph name="shield" size={18} />
          {verified} / {checks.length} {t('atelier.settings_verified')}
        </div>
      </div>
      <div className="atelier-check-list">
        {checks.map((check) => (
          <div className="atelier-check-row" key={check.id}>
            <span className={`atelier-check-icon ${check.state}`}>
              {check.state === 'on' ? <Glyph name="check" size={18} /> : '—'}
            </span>
            <div>
              <h3>{t(`atelier.setting_${check.id}`)}</h3>
              <p>{t(`atelier.detail_${check.id}`)}</p>
            </div>
            <span className="atelier-check-value">{check.value}</span>
            <span className={`atelier-state ${check.state}`}>
              {t(`atelier.state_${check.state}`)}
            </span>
          </div>
        ))}
      </div>
      <div className="atelier-setup-bottom">
        <p>{t('atelier.affinity_note')}</p>
        <div>
          <Link className="atelier-dark-button" to="/config">
            {t('atelier.edit_configuration')}
            <Glyph name="arrow" size={17} />
          </Link>
          <Link className="atelier-text-link" to="/auth-files">
            {t('atelier.manage_accounts')}
            <Glyph name="arrow" size={17} />
          </Link>
        </div>
      </div>
    </div>
  );
}
