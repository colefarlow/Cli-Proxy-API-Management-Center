import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { AuthFileItem } from '@/types/authFile';
import { accountIdentity, useAccountNames, validateAccountName } from './accountNames';
import { Glyph } from './Glyph';

export function RenameAccountButton({ file }: { file: AuthFileItem }) {
  const { t } = useTranslation();
  const id = useId();
  const { names, rename } = useAccountNames();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const save = async () => {
    if (validateAccountName(value) === null || saving) return;
    setSaving(true);
    setError(false);
    try {
      await rename(file, value);
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <button
        type="button"
        className="atelier-rename-button"
        title={t('atelier.rename_account')}
        aria-label={`${t('atelier.rename_account')} ${names[accountIdentity(file)] ?? file.email ?? file.name}`}
        onClick={() => {
          setValue(names[accountIdentity(file)] ?? '');
          setError(false);
          setOpen(true);
        }}
      >
        <Glyph name="pencil" size={14} />
      </button>
      <Modal
        open={open}
        title={t('atelier.rename_account')}
        onClose={() => setOpen(false)}
        closeDisabled={saving}
        width={440}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                void save();
              }}
              disabled={saving || validateAccountName(value) === null}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          className="atelier-rename-form"
        >
          <label htmlFor={id}>{t('atelier.account_name')}</label>
          <input
            id={id}
            value={value}
            maxLength={60}
            placeholder={file.email ?? file.name}
            onChange={(event) => setValue(event.target.value)}
          />
          <p>{t('atelier.rename_note')}</p>
          {error && <p role="alert">{t('atelier.rename_error')}</p>}
        </form>
      </Modal>
    </>
  );
}
