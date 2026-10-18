import { Button, Form } from 'antd';
import { Check, FileKey2, FileText, ShieldCheck } from 'lucide-react';
import {
  createContext,
  type ReactNode,
  useContext,
  useId,
  useRef,
  useState,
} from 'react';
import { MAX_BACKUP_BYTES } from '@/security/vault/backup';
import type { VaultClient } from '@/security/vault/client';
import {
  assert,
  parseAccountFile,
  parseRecoveryFile,
  validatePassword,
} from '@/security/vault/protocol';
import { downloadFile } from '../files';
import PasswordInput from '../PasswordInput';
import { useText } from '../text';
import s from './Management.module.css';

export type Mode =
  | 'credentials'
  | 'backup'
  | 'master'
  | 'rotation'
  | 'restore'
  | 'task';
export type Completion = {
  ownerSubject: string;
  rotationId: string;
  mode: 'ROTATION' | 'RESTORE';
  generation: number;
  keyEpoch: number;
  count: number;
};
export type Runtime = {
  client: VaultClient;
  busy: boolean;
  ownerSubject: string;
  guard: <T>(promise: Promise<T>) => Promise<T>;
  execute: (action: () => Promise<unknown>) => void;
  authorize: (name: string, action: () => Promise<void>) => void;
  finish: (completion?: Completion) => void;
  navigate: (mode: Mode, taskId?: string) => void;
  setDirty: (dirty: boolean) => void;
  checkpoint: (id: string) => void;
};
export const ManagementContext = createContext<Runtime | undefined>(undefined);
export function useManagement() {
  const value = useContext(ManagementContext);
  assert(value);
  return value;
}
export function Note({
  children,
  warning = false,
}: {
  children: ReactNode;
  warning?: boolean;
}) {
  return (
    <div className={`${s.note} ${warning ? s.warning : ''}`}>
      <ShieldCheck size={16} />
      <div>{children}</div>
    </div>
  );
}
export function Stage({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={s.stage}>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
export function Steps({
  labels,
  current,
}: {
  labels: string[];
  current: number;
}) {
  const t = useText();
  return (
    <ol className={s.steps} aria-label={t('manage.progress')}>
      {labels.map((label, i) => (
        <li
          key={label}
          className={
            i === current ? s.activeStep : i < current ? s.doneStep : ''
          }
          aria-current={i === current ? 'step' : undefined}
        >
          <span>{i < current ? <Check size={12} /> : i + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}
export function Summary({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className={s.summary}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function FlowFooter({
  children,
  back,
}: {
  children: ReactNode;
  back?: () => void;
}) {
  const t = useText();
  return (
    <div className={s.flowFooter}>
      {back && (
        <Button type="text" onClick={back}>
          {t('manage.previous')}
        </Button>
      )}
      {children}
    </div>
  );
}
export function Result({
  title,
  children,
  actions,
}: {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={s.result} role="status">
      <span className={s.resultIcon}>
        <Check size={24} />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      <div className={s.actions}>{actions}</div>
    </div>
  );
}
export function FileField({
  label,
  onChange,
  large = false,
  disabled = false,
  hint,
  validate,
}: {
  label: string;
  onChange: (text: string) => void | Promise<void>;
  large?: boolean;
  disabled?: boolean;
  hint?: string;
  validate?: (text: string) => unknown;
}) {
  const t = useText();
  const { execute, guard, busy } = useManagement();
  const id = useId();
  const sequence = useRef(0);
  const [name, setName] = useState('');
  const [state, setState] = useState<'idle' | 'reading' | 'selected' | 'error'>(
    'idle',
  );
  return (
    <div className={s.fileGroup}>
      <label
        className={`${s.file} ${state === 'error' ? s.fileError : ''}`}
        htmlFor={id}
      >
        <span className={s.fileIcon}>
          {large ? <FileText size={18} /> : <FileKey2 size={18} />}
        </span>
        <span className={s.fileText}>
          <b>{label}</b>
          <small>
            {state === 'reading'
              ? t('manage.parsing')
              : name ||
                hint ||
                t(large ? 'manage.backupLimit' : 'manage.fileLimit')}
          </small>
        </span>
        <span className={s.fileEnd}>
          {t(name ? 'vault.changeFile' : 'manage.choose')}
        </span>
        <input
          id={id}
          aria-label={label}
          type="file"
          accept="application/json,.json"
          disabled={busy || disabled}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            const serial = ++sequence.current;
            setName('');
            setState('idle');
            onChange('');
            if (!file) return;
            setState('reading');
            execute(async () => {
              try {
                assert(
                  file.size > 0 &&
                    file.size <= (large ? MAX_BACKUP_BYTES : 8192),
                );
                const text = await guard(file.text());
                if (serial !== sequence.current) return;
                validate?.(text);
                await onChange(text);
                setName(file.name);
                setState('selected');
              } catch (error) {
                if (serial === sequence.current) setState('error');
                throw error;
              }
            });
          }}
        />
      </label>
      {state === 'error' && (
        <p className={s.error} role="alert">
          {t('vault.invalidFile')}
        </p>
      )}
    </div>
  );
}
export type Material = { recovery: boolean; file: string; password: string };
export const emptyMaterial = (): Material => ({
  recovery: false,
  file: '',
  password: '',
});
export function MaterialForm({
  value,
  onChange,
  normalOnly = false,
  source = false,
  disabled = false,
}: {
  value: Material;
  onChange: (value: Material) => void;
  normalOnly?: boolean;
  source?: boolean;
  disabled?: boolean;
}) {
  const t = useText();
  const { busy } = useManagement();
  const id = useId();
  return (
    <div className={s.formWidth}>
      {!normalOnly && (
        <fieldset className={s.methods} aria-label={t('manage.unlockMethod')}>
          {[false, true].map((recovery) => (
            <Button
              key={String(recovery)}
              disabled={busy || disabled}
              aria-pressed={value.recovery === recovery}
              className={value.recovery === recovery ? s.selectedMethod : ''}
              onClick={() => onChange({ ...emptyMaterial(), recovery })}
            >
              {t(recovery ? 'vault.recoveryFile' : 'manage.normalMethod')}
            </Button>
          ))}
        </fieldset>
      )}
      <FileField
        key={String(value.recovery)}
        disabled={disabled}
        label={t(
          source
            ? value.recovery
              ? 'manage.sourceRecovery'
              : 'manage.sourceAccount'
            : value.recovery
              ? 'vault.recoveryFile'
              : 'vault.accountFile',
        )}
        hint={value.recovery ? t('manage.recoveryDistinct') : undefined}
        validate={value.recovery ? parseRecoveryFile : parseAccountFile}
        onChange={(file) => onChange({ ...value, file })}
      />
      {!value.recovery && (
        <label className={s.field} htmlFor={id}>
          {t(source ? 'manage.sourcePassword' : 'vault.masterPassword')}
          <PasswordInput
            id={id}
            aria-label={t(
              source ? 'manage.sourcePassword' : 'vault.masterPassword',
            )}
            autoComplete="off"
            value={value.password}
            disabled={busy || disabled}
            onChange={(event) =>
              onChange({ ...value, password: event.target.value })
            }
          />
        </label>
      )}
    </div>
  );
}
export function materialReady(value: Material) {
  return !!value.file && (value.recovery || !!value.password);
}
export function NewPassword({
  onNext,
  label,
}: {
  onNext: (password: string) => void;
  label?: string;
}) {
  const t = useText();
  const { busy, setDirty } = useManagement();
  const [form] = Form.useForm();
  return (
    <Form
      className={s.formWidth}
      form={form}
      layout="vertical"
      preserve={false}
      clearOnDestroy
      autoComplete="off"
      disabled={busy}
      onValuesChange={() => setDirty(true)}
      onFinish={({ password }: { password: string }) => {
        form.resetFields();
        onNext(password);
      }}
    >
      <Form.Item
        name="password"
        label={t('vault.newMaster')}
        extra={t('vault.passwordRule')}
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
        name="confirm"
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
      <FlowFooter>
        <Button type="primary" htmlType="submit" loading={busy}>
          {label || t('vault.continue')}
        </Button>
      </FlowFooter>
    </Form>
  );
}
function sameJSON(a: string, b: string) {
  const first = JSON.parse(a);
  const second = JSON.parse(b);
  const canonical = (value: unknown): string =>
    JSON.stringify(value, (_key, entry) =>
      entry && typeof entry === 'object' && !Array.isArray(entry)
        ? Object.fromEntries(
            Object.entries(entry).sort(([a], [b]) => a.localeCompare(b)),
          )
        : entry,
    );
  assert(canonical(first) === canonical(second));
}
export function FileExport({
  label,
  name,
  content,
  onVerified,
  validate,
}: {
  label: string;
  name: string;
  content: string;
  onVerified: (value: boolean) => void | Promise<void>;
  validate?: (text: string) => unknown;
}) {
  const t = useText();
  const [saved, setSaved] = useState(false);
  const [verified, setVerified] = useState(false);
  return (
    <div className={s.exportRow}>
      <div>
        <h3>{label}</h3>
        <p>{t(verified ? 'manage.fileVerified' : 'manage.exportReimport')}</p>
      </div>
      <div className={s.exportControls}>
        <Button
          onClick={() => {
            downloadFile(name, content);
            setSaved(true);
          }}
        >
          {t('manage.export')}
        </Button>
        <FileField
          label={t('manage.reimport')}
          disabled={!saved}
          hint={t(verified ? 'manage.fileVerified' : 'vault.downloadFirst')}
          validate={(text) => {
            validate?.(text);
            sameJSON(text, content);
          }}
          onChange={async (text) => {
            setVerified(!!text);
            await onVerified(!!text);
          }}
        />
      </div>
    </div>
  );
}
export function NewFiles({
  draft,
  onVerified,
}: {
  draft: Vault.PreparedSetup;
  onVerified: (verified: boolean) => void;
}) {
  const { client, guard } = useManagement();
  const t = useText();
  const matched = useRef({ account: false, recovery: false });
  return (
    <>
      <div className={s.panel}>
        {(['account', 'recovery'] as const).map((kind) => (
          <FileExport
            key={kind}
            label={t(
              kind === 'account'
                ? 'vault.newAccountFile'
                : 'vault.newRecoveryFile',
            )}
            name={`vault-${kind}-key.json`}
            content={
              kind === 'account' ? draft.accountFile : draft.recoveryFile
            }
            validate={kind === 'account' ? parseAccountFile : parseRecoveryFile}
            onVerified={async (value) => {
              matched.current[kind] = value;
              onVerified(false);
              if (matched.current.account && matched.current.recovery) {
                await guard(
                  client.call('verifyTransitionFiles', {
                    account: draft.accountFile,
                    recovery: draft.recoveryFile,
                  }),
                );
                onVerified(true);
              }
            }}
          />
        ))}
      </div>
      <Note>{t('manage.newFilesHint')}</Note>
    </>
  );
}
