import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Glyph } from './Glyph';
import { useInterfaceStore } from './interfaceStore';

const groups = [
  {
    label: 'advanced_accounts',
    items: [
      ['/quota', 'layers', 'quota', 'advanced_quota'],
      ['/oauth', 'connect', 'connect', 'advanced_connect'],
      ['/ai-providers', 'layers', 'providers', 'advanced_providers'],
    ],
  },
  {
    label: 'advanced_proxy',
    items: [
      ['/setup', 'shield', 'setup', 'advanced_setup'],
      ['/routing', 'routing', 'routing', 'advanced_routing'],
      ['/config', 'settings', 'configuration', 'advanced_config'],
    ],
  },
  {
    label: 'advanced_diagnostics',
    items: [
      ['/logs', 'chart', 'activity', 'advanced_logs'],
      ['/system', 'system', 'system', 'advanced_system'],
    ],
  },
];
export function AtelierAdvanced() {
  const { t } = useTranslation();
  return (
    <div className="atelier-advanced">
      <div className="atelier-page-intro">
        <h2>{t('atelier.advanced_heading')}</h2>
        <p>{t('atelier.advanced_intro')}</p>
      </div>
      <div className="atelier-advanced-groups">
        {groups.map((group) => (
          <section key={group.label}>
            <h3>{t(`atelier.${group.label}`)}</h3>
            {group.items.map(([path, icon, label, description]) => (
              <Link key={path} to={path} className="atelier-advanced-link">
                <span className="atelier-tool-icon">
                  <Glyph name={icon} />
                </span>
                <span>
                  <strong>{t(`atelier.${label}`)}</strong>
                  <small>{t(`atelier.${description}`)}</small>
                </span>
                <Glyph name="arrow" size={18} />
              </Link>
            ))}
          </section>
        ))}
      </div>
      <div className="atelier-original-access">
        <div>
          <h3>{t('atelier.original_controls')}</h3>
          <p>{t('atelier.original_help')}</p>
        </div>
        <button
          className="atelier-dark-button"
          onClick={() => useInterfaceStore.getState().setOriginal(true)}
        >
          {t('atelier.open_original')}
          <Glyph name="arrow" size={17} />
        </button>
      </div>
    </div>
  );
}
