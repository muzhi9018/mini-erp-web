import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
} from 'antd';
import { useEffect } from 'react';
import { validatePlain } from '@/security/vault/protocol';
import { useText } from './text';

type Editor = { itemId?: string; plain: Vault.PlainItem };
type Props = {
  rows: Vault.Summary[];
  busy: boolean;
  query: string;
  editor?: Editor;
  detail?: Vault.PlainItem;
  uncertain: boolean;
  onSearch: (value: string) => void;
  onRefresh: () => void;
  onNew: () => void;
  onReveal: (id: string) => void;
  onCopy: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (plain: Vault.PlainItem) => void;
  onGenerate: (set: (password: string) => void) => void;
  onCloseEditor: () => void;
  onCloseDetail: () => void;
};

function EditorForm({ props }: { props: Props }) {
  const t = useText();
  const [form] = Form.useForm<Vault.PlainItem>();
  useEffect(() => {
    if (props.editor) form.setFieldsValue(props.editor.plain);
    return () => form.resetFields();
  }, [props.editor]);
  return (
    <Modal
      open={!!props.editor}
      title={t(props.editor?.itemId ? 'vault.editItem' : 'vault.newItem')}
      destroyOnHidden
      footer={null}
      onCancel={props.onCloseEditor}
      mask={{ closable: false }}
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        clearOnDestroy
        autoComplete="off"
        disabled={props.busy || props.uncertain}
        onFinish={(plain) => props.onSave(plain)}
      >
        <Form.Item
          name="title"
          label={t('vault.itemTitle')}
          rules={[
            { required: true, whitespace: true, message: t('vault.required') },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="website"
          label={t('vault.website')}
          rules={[
            {
              validator: (_, value: string) => {
                try {
                  if (value) {
                    const url = new URL(value);
                    if (
                      !['https:', 'http:'].includes(url.protocol) ||
                      url.username ||
                      url.password
                    )
                      throw new Error();
                  }
                  return Promise.resolve();
                } catch {
                  return Promise.reject(new Error(t('vault.urlRule')));
                }
              },
            },
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item name="username" label={t('vault.username')}>
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item name="password" label={t('vault.password')}>
          <Input.Password autoComplete="new-password" visibilityToggle={true} />
        </Form.Item>
        <Button
          className="mb-5"
          onClick={() =>
            props.onGenerate((password) =>
              form.setFieldValue('password', password),
            )
          }
        >
          {t('vault.generatePassword')}
        </Button>
        <Form.Item name="notes" label={t('vault.notes')}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="tags" label={t('vault.tags')}>
          <Select mode="tags" maxCount={20} />
        </Form.Item>
        {props.uncertain && (
          <p className="mb-4 text-amber-700">{t('vault.uncertainWrite')}</p>
        )}
        <Space>
          <Button
            type="primary"
            loading={props.busy}
            disabled={props.busy}
            onClick={() => {
              if (props.uncertain && props.editor) {
                props.onSave(props.editor.plain);
                return;
              }
              void form
                .validateFields()
                .then((values) => {
                  const plain = {
                    ...values,
                    website: values.website || '',
                    username: values.username || '',
                    password: values.password || '',
                    notes: values.notes || '',
                    tags: values.tags || [],
                  };
                  try {
                    validatePlain(plain);
                    props.onSave(plain);
                  } catch {
                    form.setFields([
                      { name: 'notes', errors: [t('vault.itemRule')] },
                    ]);
                  }
                })
                .catch(() => {});
            }}
          >
            {t(props.uncertain ? 'vault.retrySave' : 'vault.save')}
          </Button>
          <Button disabled={false} onClick={props.onCloseEditor}>
            {t('vault.cancel')}
          </Button>
        </Space>
      </Form>
    </Modal>
  );
}

export default function Items(props: Props) {
  const t = useText();
  const detail = props.detail;
  return (
    <>
      <Card
        title={t('vault.items')}
        extra={
          <Space>
            <Button disabled={props.busy} onClick={props.onRefresh}>
              {t('vault.refresh')}
            </Button>
            <Button type="primary" disabled={props.busy} onClick={props.onNew}>
              {t('vault.newItem')}
            </Button>
          </Space>
        }
      >
        <Input
          disabled={props.busy}
          className="mb-5"
          value={props.query}
          maxLength={1024}
          placeholder={t('vault.search')}
          aria-label={t('vault.search')}
          allowClear
          onChange={(event) => props.onSearch(event.target.value)}
        />
        <Table<Vault.Summary>
          rowKey="itemId"
          dataSource={props.rows}
          loading={props.busy}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 750 }}
          columns={[
            { title: t('vault.itemTitle'), dataIndex: 'title' },
            { title: t('vault.username'), dataIndex: 'username' },
            {
              title: t('vault.website'),
              dataIndex: 'website',
              render: (value: string) =>
                value ? (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                  >
                    {value}
                  </a>
                ) : (
                  ''
                ),
            },
            {
              title: t('vault.tags'),
              dataIndex: 'tags',
              render: (tags: string[]) => tags.join(', '),
            },
            {
              title: t('vault.actions'),
              key: 'actions',
              render: (_, row) => (
                <Space wrap>
                  <Button
                    type="link"
                    disabled={props.busy}
                    onClick={() => props.onReveal(row.itemId)}
                  >
                    {t('vault.reveal')}
                  </Button>
                  <Button
                    type="link"
                    disabled={props.busy}
                    onClick={() => props.onCopy(row.itemId)}
                  >
                    {t('vault.copy')}
                  </Button>
                  <Button
                    type="link"
                    disabled={props.busy}
                    onClick={() => props.onEdit(row.itemId)}
                  >
                    {t('vault.edit')}
                  </Button>
                  <Popconfirm
                    title={t('vault.deleteConfirm')}
                    okText={t('vault.delete')}
                    cancelText={t('vault.cancel')}
                    onConfirm={() => props.onDelete(row.itemId)}
                  >
                    <Button type="link" danger disabled={props.busy}>
                      {t('vault.delete')}
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      {props.editor && <EditorForm props={props} />}
      <Modal
        open={!!detail}
        destroyOnHidden
        title={t('vault.reveal')}
        footer={null}
        onCancel={props.onCloseDetail}
      >
        {detail && (
          <dl className="grid gap-3 break-words">
            <dt className="font-semibold">{detail.title}</dt>
            <dt>{t('vault.password')}</dt>
            <dd className="select-all whitespace-pre-wrap font-mono">
              {detail.password}
            </dd>
            <dt>{t('vault.notes')}</dt>
            <dd className="whitespace-pre-wrap">{detail.notes}</dd>
            <dd className="text-slate-500">{t('vault.revealHint')}</dd>
          </dl>
        )}
      </Modal>
    </>
  );
}

export type { Editor };
