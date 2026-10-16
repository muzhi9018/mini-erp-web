import { Button, Card, Form, Input, Space } from 'antd';
import { useRef, useState } from 'react';
import { downloadFile, readKeyFile } from './files';
import { useText } from './text';

type Props = {
  session: Vault.Session;
  busy: boolean;
  codes?: Vault.RecoveryCodes;
  onLogin: (username: string, password: string) => void;
  onAuthenticate: () => void;
  onRegister: (label: string) => void;
  onRecover: (code: string) => void;
  onIssue: () => void;
  onConfirm: (file: string) => void;
  onFileError: () => void;
};

export default function Auth(props: Props) {
  const t = useText();
  const [form] = Form.useForm();
  const [downloaded, setDownloaded] = useState(false);
  const [reimport, setReimport] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const stage = props.session.stage;
  return (
    <div className="mx-auto max-w-xl">
      <Card title={t(stage ? 'vault.mfa' : 'vault.login')}>
        {!stage ? (
          <Form
            form={form}
            layout="vertical"
            preserve={false}
            clearOnDestroy
            autoComplete="off"
            onFinish={(values: { username: string; password: string }) => {
              form.resetFields(['password']);
              props.onLogin(values.username, values.password);
            }}
          >
            <Form.Item
              name="username"
              label={t('vault.username')}
              rules={[{ required: true, message: t('vault.required') }]}
            >
              <Input maxLength={128} autoComplete="username" />
            </Form.Item>
            <Form.Item
              name="password"
              label={t('vault.loginPassword')}
              rules={[{ required: true, message: t('vault.required') }]}
            >
              <Input.Password
                autoComplete="current-password"
                maxLength={1024}
                visibilityToggle={false}
              />
            </Form.Item>
            <Button htmlType="submit" type="primary" loading={props.busy}>
              {t('vault.login')}
            </Button>
          </Form>
        ) : (
          <Space orientation="vertical" size="large" className="w-full">
            <p>
              {t(
                stage === 'RECOVERY_SETUP'
                  ? 'vault.codesHint'
                  : 'vault.mfaHint',
              )}
            </p>
            {stage !== 'RECOVERY_SETUP' && (
              <>
                <Button
                  type="primary"
                  loading={props.busy}
                  onClick={props.onAuthenticate}
                >
                  {t('vault.authenticate')}
                </Button>
                <Form
                  layout="vertical"
                  preserve={false}
                  clearOnDestroy
                  onFinish={(values: { label: string }) =>
                    props.onRegister(values.label)
                  }
                >
                  <Form.Item
                    name="label"
                    label={t('vault.passkeyLabel')}
                    rules={[{ required: true, message: t('vault.required') }]}
                  >
                    <Input maxLength={128} />
                  </Form.Item>
                  <Button htmlType="submit" disabled={props.busy}>
                    {t('vault.register')}
                  </Button>
                </Form>
                {stage === 'PASSWORD' && (
                  <Form
                    layout="vertical"
                    preserve={false}
                    clearOnDestroy
                    autoComplete="off"
                    onFinish={(values: { code: string }) => {
                      form.resetFields();
                      props.onRecover(values.code);
                    }}
                    form={form}
                  >
                    <Form.Item
                      name="code"
                      label={t('vault.mfaRecoveryCode')}
                      rules={[{ required: true, message: t('vault.required') }]}
                    >
                      <Input.Password visibilityToggle={false} maxLength={43} />
                    </Form.Item>
                    <Button htmlType="submit" disabled={props.busy}>
                      {t('vault.recoverIdentity')}
                    </Button>
                  </Form>
                )}
              </>
            )}
            {stage === 'RECOVERY_SETUP' && (
              <>
                <Button
                  disabled={props.busy || !!props.codes}
                  onClick={props.onIssue}
                >
                  {t('vault.issueCodes')}
                </Button>
                {props.codes && (
                  <>
                    <Button
                      onClick={() => {
                        downloadFile(
                          'vault-mfa-recovery-codes.json',
                          JSON.stringify(props.codes),
                        );
                        setDownloaded(true);
                      }}
                    >
                      {t('vault.downloadCodes')}
                    </Button>
                    <label className="grid gap-2">
                      {t('vault.reimportCodes')}
                      <input
                        ref={fileInput}
                        type="file"
                        accept="application/json,.json"
                        disabled={!downloaded || props.busy}
                        onChange={async (event) => {
                          const input = event.currentTarget;
                          const file = input.files?.[0];
                          setReimport('');
                          try {
                            setReimport(await readKeyFile(file));
                          } catch {
                            input.value = '';
                            props.onFileError();
                          }
                        }}
                      />
                    </label>
                    <Button
                      type="primary"
                      disabled={!reimport || props.busy}
                      onClick={() => {
                        props.onConfirm(reimport);
                        setReimport('');
                        if (fileInput.current) fileInput.current.value = '';
                      }}
                    >
                      {t('vault.confirmCodes')}
                    </Button>
                  </>
                )}
              </>
            )}
          </Space>
        )}
      </Card>
    </div>
  );
}
