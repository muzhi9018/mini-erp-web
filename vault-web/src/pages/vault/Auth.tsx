import { Button, Form, Input } from 'antd';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  KeyRound,
  Plus,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AuthFoot, AuthTitle } from './AuthShell';
import { downloadFile, readKeyFile } from './files';
import PasswordInput from './PasswordInput';
import { useText } from './text';
import styles from './Vault.module.css';

export type AuthMode = 'verify' | 'enroll' | 'registered';
type Props = {
  session: Vault.Session;
  mode?: AuthMode;
  busy: boolean;
  codes?: Vault.RecoveryCodes;
  onLogin: (username: string, password: string) => void;
  onAuthenticate: () => void;
  onRegister: (label: string) => void;
  onRecover: (code: string) => void;
  onIssue: () => void;
  onConfirm: (file: string) => void;
  onFileError: () => void;
  onSwitchAccount: () => void;
};

export default function Auth(props: Props) {
  const t = useText();
  const [form] = Form.useForm();
  const [downloaded, setDownloaded] = useState(false);
  const [reimport, setReimport] = useState('');
  const [recovering, setRecovering] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const fileSerial = useRef(0);
  const stage = props.session.stage;
  useEffect(() => {
    setRecovering(false);
    setDownloaded(false);
    setReimport('');
    return () => {
      fileSerial.current++;
    };
  }, [stage, props.codes?.batchId]);
  const required = [{ required: true, message: t('vault.required') }];
  if (!stage)
    return (
      <>
        <AuthTitle
          title={t('vault.welcome')}
          description={t('vault.loginIntro')}
        />
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          clearOnDestroy
          autoComplete="off"
          disabled={props.busy}
          onFinish={(values: { username: string; password: string }) => {
            form.resetFields(['password']);
            props.onLogin(values.username, values.password);
          }}
        >
          <Form.Item
            name="username"
            label={t('vault.username')}
            rules={required}
          >
            <Input
              maxLength={128}
              autoComplete="username"
              autoFocus
              placeholder={t('vault.usernamePlaceholder')}
            />
          </Form.Item>
          <Form.Item
            name="password"
            label={t('vault.loginPassword')}
            rules={required}
          >
            <PasswordInput
              autoComplete="current-password"
              maxLength={1024}
              placeholder={t('vault.loginPasswordPlaceholder')}
            />
          </Form.Item>
          <Button block htmlType="submit" type="primary" loading={props.busy}>
            {t('vault.continue')} <ChevronRight size={16} strokeWidth={1.5} />
          </Button>
        </Form>
        <AuthFoot>{t('vault.loginFoot')}</AuthFoot>
      </>
    );
  if (stage === 'RECOVERY_SETUP')
    return (
      <>
        <div className={styles.passkeySymbol}>
          <FileText size={16} strokeWidth={1.5} />
        </div>
        <AuthTitle
          title={t('vault.codesTitle')}
          description={t('vault.codesHint')}
        />
        {!props.codes ? (
          <Button
            block
            type="primary"
            loading={props.busy}
            onClick={props.onIssue}
          >
            {t('vault.issueCodes')}
          </Button>
        ) : (
          <div className="grid gap-4">
            <Button
              block
              disabled={props.busy}
              onClick={() => {
                downloadFile(
                  'vault-mfa-recovery-codes.json',
                  JSON.stringify(props.codes),
                );
                setDownloaded(true);
              }}
            >
              <FileText size={16} strokeWidth={1.5} />
              {t('vault.downloadCodes')}
            </Button>
            <label className={styles.fileCard}>
              <span className={styles.fileIcon}>
                <FileText size={16} strokeWidth={1.5} />
              </span>
              <span>
                <b>{t('vault.reimportCodes')}</b>
                <small>
                  {t(
                    downloaded
                      ? 'vault.chooseSavedFile'
                      : 'vault.downloadFirst',
                  )}
                </small>
              </span>
              <input
                aria-label={t('vault.reimportCodes')}
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                disabled={!downloaded || props.busy}
                onChange={async (event) => {
                  const input = event.currentTarget;
                  const file = input.files?.[0];
                  const serial = ++fileSerial.current;
                  if (!file) return;
                  setReimport('');
                  try {
                    const text = await readKeyFile(file);
                    if (serial === fileSerial.current) setReimport(text);
                  } catch {
                    if (serial === fileSerial.current) {
                      input.value = '';
                      props.onFileError();
                    }
                  }
                }}
              />
            </label>
            <Button
              block
              type="primary"
              disabled={!reimport}
              loading={props.busy}
              onClick={() => {
                props.onConfirm(reimport);
                setReimport('');
                if (fileInput.current) fileInput.current.value = '';
              }}
            >
              {t('vault.confirmCodes')}
            </Button>
          </div>
        )}
        <AuthFoot>{t('vault.codesFoot')}</AuthFoot>
      </>
    );
  if (recovering && stage === 'PASSWORD')
    return (
      <>
        <AuthTitle
          title={t('vault.recoveryTitle')}
          description={t('vault.recoveryIntro')}
        />
        <p className={`${styles.help} mb-5`}>{t('vault.recoveryWarning')}</p>
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          clearOnDestroy
          autoComplete="off"
          disabled={props.busy}
          onFinish={(values: { code: string }) => {
            form.resetFields();
            props.onRecover(values.code);
          }}
        >
          <Form.Item
            name="code"
            label={t('vault.mfaRecoveryCode')}
            rules={required}
          >
            <Input.Password autoFocus visibilityToggle={false} maxLength={43} />
          </Form.Item>
          <Button block htmlType="submit" type="primary" loading={props.busy}>
            {t('vault.recoverIdentity')}
          </Button>
        </Form>
        <Button
          className="mt-4"
          type="link"
          disabled={props.busy}
          onClick={() => setRecovering(false)}
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          {t('vault.backVerify')}
        </Button>
      </>
    );
  if (!props.mode) return <p role="status">{t('vault.loadingIdentity')}</p>;
  const enroll = props.mode === 'enroll';
  const registered = props.mode === 'registered';
  return (
    <>
      <div className={styles.passkeySymbol}>
        <KeyRound size={16} strokeWidth={1.5} />
      </div>
      <AuthTitle
        title={t(
          enroll
            ? 'vault.enrollTitle'
            : registered
              ? 'vault.registeredTitle'
              : 'vault.verifyTitle',
        )}
        description={t(
          enroll
            ? 'vault.enrollIntro'
            : registered
              ? 'vault.registeredIntro'
              : 'vault.verifyIntro',
        )}
      />
      {enroll ? (
        <Form
          layout="vertical"
          preserve={false}
          clearOnDestroy
          disabled={props.busy}
          onFinish={(values: { label: string }) =>
            props.onRegister(values.label)
          }
        >
          <Form.Item
            name="label"
            label={t('vault.passkeyLabel')}
            rules={required}
          >
            <Input
              maxLength={128}
              autoFocus
              placeholder={t('vault.devicePlaceholder')}
            />
          </Form.Item>
          <Button block htmlType="submit" type="primary" loading={props.busy}>
            <Plus size={16} strokeWidth={1.5} />
            {t('vault.register')}
          </Button>
        </Form>
      ) : (
        <>
          <div className={styles.statusLine}>
            <Check size={16} strokeWidth={1.5} />
            {t(registered ? 'vault.passkeyCreated' : 'vault.accountVerified')}
          </div>
          <Button
            block
            type="primary"
            loading={props.busy}
            onClick={props.onAuthenticate}
          >
            <KeyRound size={16} strokeWidth={1.5} />
            {t(registered ? 'vault.verifyNewPasskey' : 'vault.authenticate')}
          </Button>
        </>
      )}
      <div className={styles.authLinks}>
        {stage === 'PASSWORD' && !enroll && (
          <Button
            type="link"
            disabled={props.busy}
            onClick={() => setRecovering(true)}
          >
            {t('vault.passkeyHelp')}
          </Button>
        )}
        <Button
          type="link"
          disabled={props.busy}
          onClick={props.onSwitchAccount}
        >
          {t('vault.switchAccount')}
        </Button>
      </div>
      <AuthFoot>{t('vault.verifyFoot')}</AuthFoot>
    </>
  );
}
