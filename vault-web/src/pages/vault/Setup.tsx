import { Button, Form } from 'antd';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { validatePassword } from '@/security/vault/protocol';
import { AuthTitle } from './AuthShell';
import { downloadFile, readKeyFile } from './files';
import PasswordInput from './PasswordInput';
import { useText } from './text';
import styles from './Vault.module.css';

type Props = {
  purpose?: 'rotation' | 'restore';
  busy: boolean;
  draft?: Vault.PreparedSetup;
  verified: boolean;
  onPrepare: (password: string) => void;
  onVerify: (account: string, recovery: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onFileError: () => void;
};

export default function Setup(props: Props) {
  const t = useText();
  const [form] = Form.useForm();
  const [files, setFiles] = useState({ account: '', recovery: '' });
  const [exported, setExported] = useState({ account: false, recovery: false });
  const draft = props.draft;
  return (
    <>
      <AuthTitle
        title={t(
          props.purpose === 'rotation'
            ? 'vault.rotation'
            : props.purpose === 'restore'
              ? 'vault.restore'
              : 'vault.setup',
        )}
        description={t('vault.setupHint')}
      />
      {!draft ? (
        <Form
          layout="vertical"
          form={form}
          preserve={false}
          clearOnDestroy
          autoComplete="off"
          onFinish={(values: { password: string }) => {
            form.resetFields();
            props.onPrepare(values.password);
          }}
        >
          <Form.Item
            name="password"
            label={t('vault.masterPassword')}
            rules={[
              {
                validator: (_, value: string) => {
                  try {
                    validatePassword(value);
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error(t('vault.passwordRule')));
                  }
                },
              },
            ]}
          >
            <PasswordInput autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmation"
            label={t('vault.confirmPassword')}
            dependencies={['password']}
            rules={[
              { required: true, message: t('vault.required') },
              {
                validator: (_, value: string) =>
                  value === form.getFieldValue('password')
                    ? Promise.resolve()
                    : Promise.reject(new Error(t('vault.passwordMismatch'))),
              },
            ]}
          >
            <PasswordInput autoComplete="new-password" />
          </Form.Item>
          <Button block htmlType="submit" type="primary" loading={props.busy}>
            {t('vault.prepare')}
          </Button>
        </Form>
      ) : (
        <div className={styles.setupMaterials}>
          <p className={styles.help}>{t('vault.filesHint')}</p>
          <div className={styles.setupFiles}>
            {(['account', 'recovery'] as const).map((kind) => (
              <div key={kind} className={styles.setupFileCard}>
                <h2>
                  <span className={styles.fileIcon}>
                    <FileText size={16} strokeWidth={1.5} />
                  </span>
                  {t(
                    kind === 'account'
                      ? 'vault.accountFile'
                      : 'vault.recoveryFile',
                  )}
                </h2>
                <Button
                  block
                  onClick={() => {
                    downloadFile(
                      t(
                        kind === 'account'
                          ? 'vault.accountKeyFilename'
                          : 'vault.recoveryKeyFilename',
                      ),
                      kind === 'account'
                        ? draft.accountFile
                        : draft.recoveryFile,
                    );
                    setExported((value) => ({ ...value, [kind]: true }));
                  }}
                >
                  {t(
                    kind === 'account'
                      ? 'vault.downloadAccount'
                      : 'vault.downloadRecovery',
                  )}
                </Button>
                <label className="grid gap-2">
                  {t(
                    kind === 'account'
                      ? 'vault.reimportAccount'
                      : 'vault.reimportRecovery',
                  )}
                  <input
                    type="file"
                    accept="application/json,.json"
                    disabled={!exported[kind] || props.busy || props.verified}
                    onChange={async (event) => {
                      const input = event.currentTarget;
                      const file = input.files?.[0];
                      setFiles((value) => ({ ...value, [kind]: '' }));
                      try {
                        const text = await readKeyFile(file);
                        setFiles((value) => ({ ...value, [kind]: text }));
                      } catch {
                        input.value = '';
                        props.onFileError();
                      }
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
          <div className={styles.setupActions}>
            <Button
              disabled={
                !files.account ||
                !files.recovery ||
                props.busy ||
                props.verified
              }
              onClick={() => {
                props.onVerify(files.account, files.recovery);
              }}
            >
              {t(props.verified ? 'vault.filesVerified' : 'vault.verifyFiles')}
            </Button>
            <Button
              type="primary"
              aria-label={t(
                props.purpose ? 'vault.startRotation' : 'vault.finishSetup',
              )}
              disabled={!props.verified}
              loading={props.busy}
              onClick={props.onCommit}
            >
              {t(props.purpose ? 'vault.startRotation' : 'vault.finishSetup')}
            </Button>
            <Button disabled={props.busy} onClick={props.onCancel}>
              {t('vault.cancel')}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
