import { Alert, Button, Modal } from 'antd';
import {
  Archive,
  ArchiveRestore,
  ChevronRight,
  FileLock2,
  Fingerprint,
  KeyRound,
  ListRestart,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { VaultClient } from '@/security/vault/client';
import { assert } from '@/security/vault/protocol';
import { getPasskey } from '@/security/vault/webauthn';
import { VaultHttpError } from '@/services/httpClient';
import * as auth from '@/services/vault/session';
import Backup from './management/Backup';
import Credentials from './management/Credentials';
import s from './management/Management.module.css';
import Master from './management/Master';
import {
  type Completion,
  ManagementContext,
  type Mode,
  Note,
} from './management/shared';
import Tasks from './management/Tasks';
import Transition from './management/Transition';
import { useText } from './text';

const pages = [
  ['credentials', 'manage.credentials', Fingerprint],
  ['backup', 'manage.backup', Archive],
  ['master', 'manage.master', KeyRound],
  ['rotation', 'manage.rotation', ShieldCheck],
  ['restore', 'manage.restore', ArchiveRestore],
  ['task', 'manage.tasks', ListRestart],
] as const;
export default function Maintenance(props: {
  client: VaultClient;
  busy: boolean;
  ownerSubject: string;
  guard: <T>(promise: Promise<T>) => Promise<T>;
  run: (action: () => Promise<void>) => void;
  onExit: () => void;
  onSessionChanged: (completion?: Completion) => void;
}) {
  const t = useText();
  const [mode, setMode] = useState<Mode>('credentials');
  const [revision, setRevision] = useState(0);
  const [taskId, setTaskId] = useState('');
  const [error, setError] = useState('');
  const [gate, setGate] = useState<{
    name: string;
    action: () => Promise<void>;
  }>();
  const [leaving, setLeaving] = useState<{ mode?: Mode; taskId?: string }>();
  const dirty = useRef(false);
  const alive = useRef(true);
  const serial = useRef(0);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      serial.current++;
      props.client.reset();
    };
  }, []);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);
  const guard = async <T,>(promise: Promise<T>) => {
    const current = serial.current;
    const value = await props.guard(promise);
    assert(alive.current && current === serial.current);
    return value;
  };
  const execute = (action: () => Promise<unknown>) =>
    props.run(async () => {
      setError('');
      try {
        await action();
      } catch (failure) {
        if (!alive.current) return;
        const code =
          failure instanceof VaultHttpError
            ? failure.code
            : failure instanceof Error
              ? failure.message
              : '';
        setError(
          t(
            code === 'VAULT_DECRYPT_FAILED'
              ? 'vault.unlockFailed'
              : code === 'VAULT_INVALID_FORMAT' ||
                  code === 'VAULT_INVALID_REQUEST' ||
                  failure instanceof SyntaxError
                ? 'vault.invalidFile'
                : code === 'VAULT_VERSION_CONFLICT'
                  ? 'vault.conflict'
                  : code === 'VAULT_ROTATION_EXPIRED'
                    ? 'vault.taskExpired'
                    : code === 'VAULT_WRITE_LOCKED'
                      ? 'vault.writeLocked'
                      : code === 'VAULT_ALREADY_INITIALIZED'
                        ? 'vault.restoreEmptyOnly'
                        : code === 'VAULT_NOT_FOUND'
                          ? 'manage.taskNotFound'
                          : code === 'VAULT_REAUTH_REQUIRED'
                            ? 'manage.reauthRetry'
                            : code === 'VAULT_CLIENT_UPGRADE_REQUIRED'
                              ? 'vault.upgradeRequired'
                              : code === 'VAULT_MFA_REQUIRED'
                                ? 'manage.takeoverDenied'
                                : code === 'VAULT_RECOVERY_CODES_EXPIRED'
                                  ? 'manage.codesExpired'
                                  : 'vault.requestFailed',
          ),
        );
      }
    });
  const protectedAction = async (name: string, action: () => Promise<void>) => {
    try {
      await action();
    } catch (failure) {
      if (
        failure instanceof VaultHttpError &&
        failure.code === 'VAULT_REAUTH_REQUIRED'
      )
        setGate({ name, action });
      else throw failure;
    }
  };
  const checkIdentity = (session: Vault.Session) => {
    if (
      session.stage !== 'MFA' ||
      session.ownerSubject !== props.ownerSubject
    ) {
      window.dispatchEvent(new Event('vault-session-ended'));
      throw new VaultHttpError(401, 'VAULT_SESSION_REVOKED');
    }
  };
  const authorize = (name: string, action: () => Promise<void>) =>
    execute(async () => {
      const session = await guard(auth.options());
      checkIdentity(session);
      if (session.recentAuthentication) await protectedAction(name, action);
      else setGate({ name, action });
    });
  const move = (next?: Mode, id?: string) => {
    serial.current++;
    props.client.reset();
    dirty.current = false;
    setGate(undefined);
    setError('');
    setLeaving(undefined);
    if (!next) {
      props.onExit();
      return;
    }
    setTaskId(id || taskId);
    setMode(next);
    setRevision((value) => value + 1);
  };
  const navigate = (next: Mode, id?: string) => {
    if (dirty.current) setLeaving({ mode: next, taskId: id });
    else move(next, id);
  };
  const selected = pages.find(([key]) => key === mode) || pages[0];
  return (
    <ManagementContext.Provider
      value={{
        client: props.client,
        busy: props.busy,
        ownerSubject: props.ownerSubject,
        guard,
        execute,
        authorize,
        finish: props.onSessionChanged,
        navigate,
        setDirty: (value) => {
          dirty.current = value;
        },
        checkpoint: setTaskId,
      }}
    >
      <div className={s.mobileNav}>
        <label htmlFor="management-navigation">{t('manage.navigation')}</label>
        <select
          id="management-navigation"
          aria-label={t('manage.navigation')}
          disabled={props.busy}
          value={mode}
          onChange={(event) => navigate(event.target.value as Mode)}
        >
          {pages.map(([key, label]) => (
            <option key={key} value={key}>
              {t(label)}
            </option>
          ))}
        </select>
      </div>
      <div className={s.layout}>
        <aside className={s.side}>
          <nav aria-label={t('manage.navigation')}>
            <div className={s.group}>{t('manage.accountGroup')}</div>
            {pages.map(([key, label, Icon], index) => (
              <div key={key}>
                {index === 3 && (
                  <div className={`${s.group} ${s.groupSecond}`}>
                    {t('manage.recoveryGroup')}
                  </div>
                )}
                <button
                  type="button"
                  className={`${s.nav} ${mode === key ? s.selected : ''}`}
                  aria-current={mode === key ? 'page' : undefined}
                  disabled={props.busy}
                  onClick={() => navigate(key)}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  <span>{t(label)}</span>
                </button>
              </div>
            ))}
          </nav>
          <div className={s.localNote}>
            <FileLock2 size={16} />
            <span>{t('manage.localNote')}</span>
          </div>
        </aside>
        <section className={s.main} key={revision} aria-label={t(selected[1])}>
          <div className={s.breadcrumb}>
            {t('manage.title')}
            <ChevronRight size={13} />
            {t(selected[1])}
          </div>
          <div className={s.head}>
            <div>
              <h1>{t(selected[1])}</h1>
              <p>{t(`manage.${mode}Hint`)}</p>
            </div>
            <Button
              type="text"
              disabled={props.busy}
              onClick={() => (dirty.current ? setLeaving({}) : move())}
            >
              {t('manage.backVault')}
            </Button>
          </div>
          {error && (
            <div role="alert" className="mb-5">
              <Alert type="error" showIcon title={error} />
            </div>
          )}
          {mode === 'credentials' ? (
            <Credentials />
          ) : mode === 'backup' ? (
            <Backup />
          ) : mode === 'master' ? (
            <Master />
          ) : mode === 'task' ? (
            <Tasks initialId={taskId} />
          ) : (
            <Transition restore={mode === 'restore'} />
          )}
        </section>
      </div>
      <Modal
        open={!!gate}
        title={t('manage.authTitle')}
        footer={null}
        closable={!props.busy}
        mask={{ closable: false }}
        onCancel={() => setGate(undefined)}
        destroyOnHidden
      >
        <p>{t('manage.authHint', { action: gate?.name || '' })}</p>
        <Note>{t('manage.authDistinct')}</Note>
        <div className={s.actions}>
          <Button disabled={props.busy} onClick={() => setGate(undefined)}>
            {t('vault.cancel')}
          </Button>
          <Button
            type="primary"
            loading={props.busy}
            onClick={() =>
              execute(async () => {
                assert(gate);
                const current = gate;
                const options = await guard(auth.authenticateOptions());
                const credential = await guard(getPasskey(options));
                checkIdentity(await guard(auth.authenticate(credential)));
                setGate(undefined);
                await protectedAction(current.name, current.action);
              })
            }
          >
            {t('vault.authenticate')}
          </Button>
        </div>
      </Modal>
      <Modal
        open={!!leaving}
        title={t('manage.leaveTitle')}
        footer={null}
        mask={{ closable: false }}
        onCancel={() => setLeaving(undefined)}
        destroyOnHidden
      >
        <p>{t('manage.leaveHint')}</p>
        <div className={s.actions}>
          <Button onClick={() => setLeaving(undefined)}>
            {t('vault.cancel')}
          </Button>
          <Button
            type="primary"
            onClick={() => move(leaving?.mode, leaving?.taskId)}
          >
            {t('manage.leaveClear')}
          </Button>
        </div>
      </Modal>
    </ManagementContext.Provider>
  );
}
