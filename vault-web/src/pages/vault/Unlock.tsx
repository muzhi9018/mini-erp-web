import { Button, Card, Form, Input } from 'antd';
import { useRef, useState } from 'react';
import { readKeyFile } from './files';
import { useText } from './text';

export default function Unlock(props: {
  busy: boolean;
  onUnlock: (file: string, password: string) => void;
  onFileError: () => void;
}) {
  const t = useText();
  const [form] = Form.useForm();
  const [file, setFile] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <div className="mx-auto max-w-xl">
      <Card title={t('vault.unlock')}>
        <p className="mb-6 text-slate-600">{t('vault.unlockHint')}</p>
        <Form
          layout="vertical"
          form={form}
          preserve={false}
          clearOnDestroy
          autoComplete="off"
          onFinish={(values: { password: string }) => {
            form.resetFields();
            props.onUnlock(file, values.password);
            setFile('');
            if (fileInput.current) fileInput.current.value = '';
          }}
        >
          <label className="mb-5 grid gap-2">
            {t('vault.accountFile')}
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              disabled={props.busy}
              onChange={async (event) => {
                const input = event.currentTarget;
                const value = input.files?.[0];
                setFile('');
                try {
                  setFile(await readKeyFile(value));
                } catch {
                  input.value = '';
                  props.onFileError();
                }
              }}
            />
          </label>
          <Form.Item
            name="password"
            label={t('vault.masterPassword')}
            rules={[{ required: true, message: t('vault.required') }]}
          >
            <Input.Password autoComplete="off" visibilityToggle={false} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={props.busy}
            disabled={!file}
          >
            {t('vault.unlock')}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
