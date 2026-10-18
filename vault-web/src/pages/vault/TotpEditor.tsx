import { Button, Modal } from 'antd';
import { Plus, RefreshCw, ScanLine, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { trapDialogTab } from './dialog';
import styles from './Entries.module.css';
import { useText } from './text';

export default function TotpEditor(props: {
  hasTotp: boolean;
  info?: Vault.TotpInfo | null;
  disabled: boolean;
  value: Vault.Totp | null;
  preserve: boolean;
  onImport: () => void;
  onChange: (value: Vault.Totp | null, preserve: boolean) => void;
}) {
  const t = useText();
  const [confirm, setConfirm] = useState<'replace' | 'remove'>();
  const configured = !!props.value || (props.preserve && props.hasTotp);
  const info = props.value || props.info;
  return (
    <section className={styles.formSection}>
      <h3>{t('vault.totp')}（2FA）</h3>
      <div className={styles.factorSummary}>
        <ScanLine size={23} />
        <div className="min-w-0 flex-1">
          <b>{t(configured ? 'entries.factorSaved' : 'entries.factorEmpty')}</b>
          <p className={styles.help}>
            {configured && info
              ? `${info.issuer} · ${info.accountName}`
              : t('entries.factorHint')}
          </p>
          {configured && info && (
            <p className={styles.help}>
              {t('entries.rule', { digits: info.digits, seconds: info.period })}
            </p>
          )}
          {!props.preserve && (props.value || props.hasTotp) && (
            <p className={styles.status} role="status">
              {t(props.value ? 'entries.addedDraft' : 'entries.removedDraft')}
            </p>
          )}
        </div>
        {configured ? (
          <div className="flex flex-wrap gap-1">
            <Button
              type="text"
              disabled={props.disabled}
              icon={<RefreshCw size={15} />}
              onClick={() => setConfirm('replace')}
            >
              {t('vault.totpReplace')}
            </Button>
            <Button
              type="text"
              danger
              disabled={props.disabled}
              icon={<Trash2 size={15} />}
              onClick={() => setConfirm('remove')}
            >
              {t('vault.totpRemove')}
            </Button>
          </div>
        ) : (
          <Button
            disabled={props.disabled}
            icon={<Plus size={16} />}
            onClick={props.onImport}
          >
            {t('vault.totpAdd')}
          </Button>
        )}
      </div>
      {confirm && (
        <Modal
          open
          modalRender={(node) => (
            <div role="presentation" onKeyDownCapture={trapDialogTab}>
              {node}
            </div>
          )}
          closable={{ 'aria-label': t('entries.closeDialog') }}
          getContainer={false}
          className={styles.dialog}
          title={t(
            confirm === 'remove'
              ? 'entries.removeTitle'
              : 'entries.replaceTitle',
          )}
          destroyOnHidden
          focusable={{ trap: true, focusTriggerAfterClose: true }}
          mask={{ closable: false }}
          onCancel={() => setConfirm(undefined)}
          okText={t(
            confirm === 'remove' ? 'vault.totpRemove' : 'entries.importStep',
          )}
          cancelText={t('vault.cancel')}
          okButtonProps={{ danger: confirm === 'remove' }}
          onOk={() => {
            if (confirm === 'remove') props.onChange(null, false);
            else props.onImport();
            setConfirm(undefined);
          }}
        >
          <p>
            {t(
              confirm === 'remove'
                ? 'entries.removeWarning'
                : 'entries.replaceWarning',
            )}
          </p>
        </Modal>
      )}
    </section>
  );
}
