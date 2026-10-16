import { Button, Card, Form, Input, Space } from 'antd';
import { useState } from 'react';
import { validatePassword } from '@/security/vault/protocol';
import { downloadFile, readKeyFile } from './files';
import { useText } from './text';

type Props = {
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
    <div className="mx-auto max-w-2xl">
      <Card title={t('vault.setup')}>
        <p className="mb-6 text-slate-600">{t('vault.setupHint')}</p>
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
              <Input.Password
                autoComplete="new-password"
                visibilityToggle={false}
              />
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
              <Input.Password
                autoComplete="new-password"
                visibilityToggle={false}
              />
            </Form.Item>
            <Button htmlType="submit" type="primary" loading={props.busy}>
              {t('vault.prepare')}
            </Button>
          </Form>
        ) : (
          <Space orientation="vertical" size="large" className="w-full">
            <p>{t('vault.filesHint')}</p>
            {(['account', 'recovery'] as const).map((kind) => (
              <div
                key={kind}
                className="grid gap-3 rounded-lg border border-slate-200 p-4"
              >
                <Button
                  onClick={() => {
                    downloadFile(
                      kind === 'account'
                        ? 'vault-account-key.json'
                        : 'vault-recovery-key.json',
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
            <Space wrap>
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
                {t(
                  props.verified ? 'vault.filesVerified' : 'vault.verifyFiles',
                )}
              </Button>
              <Button
                type="primary"
                disabled={!props.verified}
                loading={props.busy}
                onClick={props.onCommit}
              >
                {t('vault.finishSetup')}
              </Button>
              <Button disabled={props.busy} onClick={props.onCancel}>
                {t('vault.cancel')}
              </Button>
            </Space>
          </Space>
        )}
      </Card>
    </div>
  );
}
