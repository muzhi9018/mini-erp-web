import { Button, Form } from 'antd';
import { Check, FileText, LockKeyhole } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { parseAccountFile } from '@/security/vault/protocol';
import { AuthFoot, AuthTitle } from './AuthShell';
import { readKeyFile } from './files';
import PasswordInput from './PasswordInput';
import { type MessageKey, useText } from './text';
import styles from './Vault.module.css';

export default function Unlock(props: {
  busy: boolean;
  hasAccount?: boolean;
  meta: Vault.Meta;
  ownerSubject: string;
  onUnlock: (file: string, password: string) => void;
  onSwitchAccount: () => void;
}) {
  const t = useText();
  const [form] = Form.useForm();
  const [file, setFile] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<MessageKey>();
  const [help, setHelp] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const fileSerial = useRef(0);
  useEffect(
    () => () => {
      fileSerial.current++;
    },
    [],
  );
  return (
    <>
      <AuthTitle
        title={t('vault.unlockTitle')}
        description={t('vault.unlockIntro')}
      />
      <label className={`${styles.fileCard} ${file ? styles.fileReady : ''}`}>
        <span className={styles.fileIcon}>
          {file ? (
            <Check size={16} strokeWidth={1.5} />
          ) : (
            <FileText size={16} strokeWidth={1.5} />
          )}
        </span>
        <span>
          <b>{file ? name : t('vault.chooseAccountFile')}</b>
          <small>
            {t(
              props.hasAccount
                ? 'deleted.accountRetained'
                : file
                  ? 'vault.fileMatched'
                  : 'vault.fileRefreshHint',
            )}
          </small>
        </span>
        <span className={styles.fileEnd}>
          {t(file ? 'vault.changeFile' : 'vault.chooseFile')}
        </span>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          disabled={props.busy}
          aria-label={t('vault.accountFile')}
          onChange={async (event) => {
            const input = event.currentTarget;
            const selected = input.files?.[0];
            if (!selected) return;
            const serial = ++fileSerial.current;
            setFile('');
            setError(undefined);
            try {
              const text = await readKeyFile(selected);
              if (serial !== fileSerial.current) return;
              const raw: unknown = JSON.parse(text);
              if (
                raw &&
                typeof raw === 'object' &&
                'formatVersion' in raw &&
                raw.formatVersion !== 1
              ) {
                setError('vault.fileVersion');
                return;
              }
              const account = parseAccountFile(text);
              const slot = props.meta.keySlots?.find(
                (entry) => entry.slotType === 'NORMAL',
              );
              if (
                account.ownerSubject !== props.ownerSubject ||
                account.vaultId !== props.meta.vaultId ||
                account.accountKeyId !== slot?.keyId
              ) {
                setError('vault.fileMismatch');
                return;
              }
              setFile(text);
              setName(selected.name);
              form.getFieldInstance('password')?.focus();
            } catch {
              if (serial === fileSerial.current) setError('vault.invalidFile');
            } finally {
              if (serial === fileSerial.current) input.value = '';
            }
          }}
        />
      </label>
      {error && (
        <p className={styles.fieldError} role="alert">
          {t(error)}
        </p>
      )}
      <Form
        layout="vertical"
        form={form}
        preserve={false}
        clearOnDestroy
        autoComplete="off"
        disabled={props.busy}
        onFinish={(values: { password: string }) => {
          form.resetFields();
          props.onUnlock(file, values.password);
        }}
      >
        <Form.Item
          name="password"
          label={t('vault.masterPassword')}
          rules={[{ required: true, message: t('vault.required') }]}
        >
          <PasswordInput
            autoComplete="off"
            autoFocus
            placeholder={t('vault.masterPlaceholder')}
          />
        </Form.Item>
        <Button
          block
          type="primary"
          htmlType="submit"
          loading={props.busy}
          disabled={!file && !props.hasAccount}
        >
          <LockKeyhole size={16} strokeWidth={1.5} />
          {t('vault.unlock')}
        </Button>
      </Form>
      <div className={styles.authLinks}>
        <Button type="link" onClick={() => setHelp(!help)} aria-expanded={help}>
          {t('vault.unlockHelp')}
        </Button>
        <Button
          type="link"
          disabled={props.busy}
          onClick={props.onSwitchAccount}
        >
          {t('vault.switchAccount')}
        </Button>
      </div>
      {help && <div className={styles.pop}>{t('vault.unlockHelpText')}</div>}
      <AuthFoot>{t('vault.unlockHint')}</AuthFoot>
    </>
  );
}
