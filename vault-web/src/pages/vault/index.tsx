import { useQueryClient } from '@tanstack/react-query';
import { getLocale, setLocale } from '@umijs/max';
import { Alert, App, Button, Dropdown, Select } from 'antd';
import {
  Ellipsis,
  FileText,
  LockKeyhole,
  LogOut,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VaultClient } from '@/security/vault/client';
import { assert, object } from '@/security/vault/protocol';
import { createPasskey, getPasskey } from '@/security/vault/webauthn';
import {
  clearSession,
  invalidateResponses,
  VaultHttpError,
} from '@/services/httpClient';
import * as itemAPI from '@/services/vault/item';
import * as rotationAPI from '@/services/vault/rotation';
import * as auth from '@/services/vault/session';
import * as vaultAPI from '@/services/vault/vault';
import Auth, { type AuthMode } from './Auth';
import AuthShell from './AuthShell';
import type { EditorHandle } from './ItemEditor';
import Items, { type Editor } from './Items';
import Maintenance from './Maintenance';
import {
  forgetCompletion,
  readCompletion,
  rememberCompletion,
} from './management/completion';
import type { Completion } from './management/shared';
import Setup from './Setup';
import { passkeyErrorKeys, useText } from './text';
import Unlock from './Unlock';
import styles from './Vault.module.css';
import VaultTheme, { useVaultTheme } from './VaultTheme';

const emptyItem = (): Vault.PlainItem => ({
  itemSchemaVersion: 2,
  totp: null,
  title: '',
  website: '',
  username: '',
  password: '',
  notes: '',
  tags: [],
});

function VaultWorkspace() {
  const t = useText();
  const { dark, toggle: toggleTheme } = useVaultTheme();
  const { message } = App.useApp();
  const cache = useQueryClient();
  const client = useRef(new VaultClient()).current;
  const [session, setSession] = useState<Vault.Session>();
  const [meta, setMeta] = useState<Vault.Meta>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState<Vault.PreparedSetup>();
  const [verified, setVerified] = useState(false);
  const [codes, setCodes] = useState<Vault.RecoveryCodes>();
  const [authMode, setAuthMode] = useState<AuthMode>();
  const [maintenance, setMaintenance] = useState(false);
  const [completion, setCompletion] = useState<Completion | undefined>(
    readCompletion,
  );
  const [completionVerified, setCompletionVerified] = useState(false);
  const [limitations, setLimitations] = useState(false);
  const [allRows, setAllRows] = useState<Vault.Summary[]>([]);
  const [selected, setSelected] = useState<string>();
  const selectedRef = useRef<string | undefined>(undefined);
  const exposure = useRef(0);
  const [revealUntil, setRevealUntil] = useState(0);
  const [copyFallback, setCopyFallback] = useState<string>();
  const [syncFailed, setSyncFailed] = useState(false);
  const [rows, setRows] = useState<Vault.Summary[]>([]);
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Vault.PlainItem>();
  const [editor, setEditor] = useState<Editor>();
  const editorRef = useRef<EditorHandle>(null);
  const [uncertain, setUncertain] = useState(false);
  const pendingWrite = useRef<Vault.ItemWrite | undefined>(undefined);
  const setupKey = useRef<string | undefined>(undefined);
  const deleteKeys = useRef(new Map<string, string>());
  const epoch = useRef(0);
  const owner = useRef<string | undefined>(undefined);
  const active = useRef(false);
  const inFlight = useRef(false);
  const lastActivity = useRef(Date.now());
  const hiddenAt = useRef<number | undefined>(undefined);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const channel = useRef<BroadcastChannel | undefined>(undefined);
  const searchSerial = useRef(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const conceal = useCallback(() => {
    setMaintenance(false);
    exposure.current++;
    setDetail(undefined);
    setCopyFallback(undefined);
    setRevealUntil(0);
    setEditor(undefined);
    pendingWrite.current = undefined;
    setUncertain(false);
    clearTimeout(revealTimer.current);
  }, []);
  const lock = useCallback(
    (broadcast = false) => {
      epoch.current++;
      invalidateResponses();
      client.reset();
      active.current = false;
      inFlight.current = false;
      void cache.cancelQueries();
      cache.clear();
      conceal();
      message.destroy();
      setUnlocked(false);
      setDraft(undefined);
      setVerified(false);
      setCodes(undefined);
      setRows([]);
      setAllRows([]);
      setSelected(undefined);
      selectedRef.current = undefined;
      setSyncFailed(false);
      setQuery('');
      clearTimeout(searchTimer.current);
      setBusy(false);
      setUncertain(false);
      pendingWrite.current = undefined;
      setupKey.current = undefined;
      deleteKeys.current.clear();
      setRevision((value) => value + 1);
      if (broadcast) channel.current?.postMessage('lock');
    },
    [cache, client, conceal, message],
  );

  const expired = () =>
    Date.now() < lastActivity.current ||
    Date.now() - lastActivity.current >= VAULT_AUTO_LOCK.idleMinutes * 60_000 ||
    (hiddenAt.current !== undefined &&
      Date.now() - hiddenAt.current >=
        VAULT_AUTO_LOCK.backgroundSeconds * 1_000);
  function check() {
    if (active.current && expired()) {
      lock(true);
      throw new Error('VAULT_LOCKED');
    }
  }
  async function guard<T>(promise: Promise<T>) {
    const current = epoch.current;
    const result = await promise;
    if (epoch.current !== current) throw new Error('VAULT_LOCKED');
    check();
    return result;
  }
  function run(action: () => Promise<void>) {
    if (inFlight.current) return;
    try {
      check();
    } catch {
      return;
    }
    const current = epoch.current;
    inFlight.current = true;
    setBusy(true);
    setError('');
    void action()
      .catch((failure: unknown) => {
        if (
          current === epoch.current &&
          failure instanceof VaultHttpError &&
          failure.status !== 0
        ) {
          pendingWrite.current = undefined;
          setUncertain(false);
        }
        if (current === epoch.current)
          setError(
            failure instanceof VaultHttpError
              ? failure.code
              : failure instanceof Error && failure.message.startsWith('VAULT_')
                ? failure.message
                : 'VAULT_REQUEST_FAILED',
          );
      })
      .finally(() => {
        if (current === epoch.current) {
          inFlight.current = false;
          setBusy(false);
        }
      });
  }
  async function loadSession() {
    const result = await guard(auth.options());
    if (owner.current && owner.current !== result.ownerSubject) {
      lock(true);
      owner.current = result.ownerSubject;
      setSession(result);
      setMeta(undefined);
      throw new Error('VAULT_LOCKED');
    }
    owner.current = result.ownerSubject;
    setSession(result);
    setCompletion(readCompletion());
    setAuthMode(undefined);
    if (result.stage === 'MFA') await loadMeta();
    else if (
      result.stage === 'PASSWORD' ||
      result.stage === 'RECOVERY_ENROLLMENT'
    ) {
      try {
        // A server-issued authentication challenge proves an active passkey exists.
        await guard(auth.authenticateOptions());
        setAuthMode('verify');
      } catch (failure) {
        if (
          !(failure instanceof VaultHttpError) ||
          failure.code !== 'VAULT_MFA_REQUIRED'
        )
          throw failure;
        // Registration is shown only after the server authorizes enrollment.
        await guard(auth.registerOptions());
        setAuthMode('enroll');
      }
    }
    return result;
  }
  async function loadMeta() {
    const value = await guard(vaultAPI.meta());
    setMeta(value);
    return value;
  }
  async function sync(value?: Vault.Meta, prefer?: string) {
    const selection = prefer || selectedRef.current;
    setSyncFailed(false);
    try {
      setRows([]);
      setQuery('');
      conceal();
      clearTimeout(searchTimer.current);
      await guard(client.call('resetIndex', {}));
      const fresh = value || (await loadMeta());
      const items = await guard(
        cache.fetchQuery({
          queryKey: [
            'vault-ciphertext',
            session?.ownerSubject,
            fresh.vaultId,
            fresh.generation,
            fresh.collectionRevision,
          ],
          queryFn: ({ signal }) => itemAPI.allItems(fresh, signal),
          staleTime: 0,
        }),
      );
      for (let offset = 0; offset < items.length; offset += 100)
        await guard(
          client.call('ingest', { items: items.slice(offset, offset + 100) }),
        );
      const summaries = await guard(client.call('search', { query: '' }));
      setRows(summaries);
      setAllRows(summaries);
      const receipt = readCompletion();
      if (receipt && receipt.ownerSubject === owner.current) {
        const status = await guard(rotationAPI.status(receipt.rotationId));
        if (status.status === 'COMMITTED') {
          if (
            fresh.generation !== receipt.generation ||
            fresh.keyEpoch !== receipt.keyEpoch ||
            summaries.length !== receipt.count
          )
            throw new Error('VAULT_COMPLETION_MISMATCH');
          setCompletion(receipt);
          setCompletionVerified(true);
          forgetCompletion();
        } else if (
          status.status === 'CANCELLED' ||
          status.status === 'EXPIRED'
        ) {
          forgetCompletion();
          setCompletion(undefined);
        }
      }
      const next =
        summaries.find((item) => item.itemId === selection)?.itemId ||
        summaries[0]?.itemId;
      selectedRef.current = next;
      setSelected(next);
      deleteKeys.current.clear();
    } catch (failure) {
      setSyncFailed(true);
      throw failure;
    }
  }
  async function authenticate() {
    const options = await guard(auth.authenticateOptions());
    const credential = await guard(getPasskey(options));
    await guard(auth.authenticate(credential));
    return loadSession();
  }

  useEffect(() => {
    run(async () => {
      await loadSession();
    });
    const sessionEnded = () => {
      lock(true);
      setSession(undefined);
      setMeta(undefined);
      setError('VAULT_SESSION_EXPIRED');
    };
    const workerFailed = () => {
      lock(true);
      setError('VAULT_WORKER_FAILED');
    };
    const activity = (event: Event) => {
      if (!event.isTrusted) return;
      if (active.current && expired()) {
        lock(true);
        return;
      }
      lastActivity.current = Date.now();
    };
    const inspect = () => {
      if (active.current && expired()) lock(true);
    };
    const visibility = () => {
      if (document.hidden) {
        conceal();
        hiddenAt.current = Date.now();
      } else {
        inspect();
        hiddenAt.current = undefined;
      }
    };
    const pageHide = () => lock();
    const pageShow = (event: PageTransitionEvent) => {
      if (event.persisted) lock();
      else inspect();
    };
    const timer = setInterval(inspect, 1000);
    for (const type of ['pointerdown', 'keydown', 'touchstart', 'wheel'])
      window.addEventListener(type, activity, { passive: true });
    window.addEventListener('focus', inspect);
    window.addEventListener('pageshow', pageShow);
    window.addEventListener('pagehide', pageHide);
    window.addEventListener('vault-session-ended', sessionEnded);
    window.addEventListener('vault-worker-failed', workerFailed);
    document.addEventListener('visibilitychange', visibility);
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('mini-erp-vault-lifecycle');
      channel.current.onmessage = (event: MessageEvent<unknown>) => {
        if (event.data === 'lock') lock();
        if (event.data === 'logout') sessionEnded();
      };
    }
    return () => {
      // Development effect replay and Fast Refresh preserve refs and state.
      // Release the old operation as well as its worker before loading again.
      lock();
      clearInterval(timer);
      clearTimeout(revealTimer.current);
      clearTimeout(searchTimer.current);
      channel.current?.close();
      for (const type of ['pointerdown', 'keydown', 'touchstart', 'wheel'])
        window.removeEventListener(type, activity);
      window.removeEventListener('focus', inspect);
      window.removeEventListener('pageshow', pageShow);
      window.removeEventListener('pagehide', pageHide);
      window.removeEventListener('vault-session-ended', sessionEnded);
      window.removeEventListener('vault-worker-failed', workerFailed);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  const errorText = () => {
    const passkeyError = passkeyErrorKeys[error];
    if (passkeyError) return t(passkeyError);
    if (error === 'VAULT_COMPLETION_MISMATCH')
      return t('manage.completionMismatch');
    if (error === 'VAULT_ALREADY_INITIALIZED')
      return t('vault.restoreEmptyOnly');
    if (error === 'VAULT_ROTATION_EXPIRED') return t('vault.taskExpired');
    if (error === 'VAULT_CLIENT_UPGRADE_REQUIRED')
      return t('vault.upgradeRequired');
    if (error === 'VAULT_VERSION_CONFLICT') return t('vault.conflict');
    if (error === 'VAULT_WRITE_LOCKED') return t('vault.writeLocked');
    if (error === 'VAULT_REAUTH_REQUIRED') return t('vault.reauthRequired');
    if (error === 'VAULT_INVALID_FORMAT' || error === 'VAULT_INVALID_REQUEST')
      return t('vault.invalidFile');
    if (error === 'VAULT_INVALID_RESPONSE') return t('vault.invalidResponse');
    if (error === 'VAULT_DECRYPT_FAILED') return t('vault.unlockFailed');
    if (error.includes('SESSION') || error === 'VAULT_LOCKED')
      return t('vault.sessionExpired');
    if (error === 'VAULT_INVALID_CREDENTIALS')
      return t('vault.invalidCredentials');
    if (error === 'VAULT_MFA_RECOVERY_INVALID')
      return t('vault.invalidRecoveryCode');
    if (error.includes('CSRF') || error === 'VAULT_ORIGIN_REJECTED')
      return t('vault.requestRejected');
    return t('vault.requestFailed');
  };
  const fileError = () => setError('VAULT_INVALID_FORMAT');
  const closeEditor = () => {
    exposure.current++;
    setEditor(undefined);
    pendingWrite.current = undefined;
    setUncertain(false);
  };
  const navigate = (action: () => void) => {
    if (editor)
      editorRef.current?.leave(() => {
        closeEditor();
        action();
      });
    else action();
  };
  const exportSession = async () => {
    check();
    const current = await guard(auth.options());
    if (current.ownerSubject !== owner.current || current.stage !== 'MFA') {
      lock(true);
      owner.current = current.ownerSubject;
      setSession(current);
      setMeta(undefined);
      throw new Error('VAULT_LOCKED');
    }
    assert(active.current);
    return current;
  };

  const switchAccount = () => {
    lock(true);
    owner.current = undefined;
    run(async () => {
      await guard(auth.logout());
      clearSession();
      channel.current?.postMessage('logout');
      setSession(undefined);
      setMeta(undefined);
      await loadSession();
    });
  };
  const hideDetail = () => {
    exposure.current++;
    setDetail(undefined);
    setCopyFallback(undefined);
    setRevealUntil(0);
    clearTimeout(revealTimer.current);
  };
  const select = (id?: string) => {
    hideDetail();
    selectedRef.current = id;
    setSelected(id);
  };
  const copyText = async (value: string, serial: number) => {
    assert(serial === exposure.current && !document.hidden);
    try {
      await guard(navigator.clipboard.writeText(value));
      if (serial === exposure.current && !document.hidden)
        message.success(t('vault.copied'));
    } catch {
      if (serial !== exposure.current || document.hidden) return;
      setCopyFallback(value);
      revealTimer.current = setTimeout(hideDetail, 20000);
    }
  };

  return (
    <main
      className={styles.root}
      data-management={maintenance || undefined}
      data-workspace={unlocked || undefined}
    >
      <div className={styles.shell}>
        <div className={styles.notice}>
          <FileText size={16} strokeWidth={1.5} />
          <span>{t('vault.testNotice')}</span>
          <button
            type="button"
            onClick={() => setLimitations(!limitations)}
            aria-expanded={limitations}
          >
            {t('vault.viewLimitations')}
          </button>
        </div>
        {limitations && (
          <div className={styles.testDetails}>{t('vault.previewNotice')}</div>
        )}
        <header className={styles.top}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>
              <ShieldCheck size={16} strokeWidth={1.5} />
            </span>
            <div className={styles.wordmark}>
              Vault
              <span className={styles.logoSub}>
                {t(maintenance ? 'manage.title' : 'vault.title')}
              </span>
            </div>
          </div>
          <div className={styles.actions}>
            <Select
              className={unlocked ? styles.workspaceExtra : undefined}
              aria-label={t('vault.language')}
              value={getLocale()}
              labelRender={(option) => (
                <>
                  <span className={styles.languageFull}>{option.label}</span>
                  <span className={styles.languageShort}>
                    {option.value === 'en-US'
                      ? 'EN'
                      : option.value === 'zh-TW'
                        ? '繁'
                        : '简'}
                  </span>
                </>
              )}
              onChange={(locale: string) => {
                navigate(() => {
                  lock();
                  setLocale(locale, false);
                });
              }}
              options={[
                { value: 'zh-CN', label: '简体中文' },
                { value: 'zh-TW', label: '繁體中文' },
                { value: 'en-US', label: 'English' },
              ]}
            />
            {session?.stage === 'MFA' && !unlocked && (
              <Button
                loading={busy}
                onClick={() =>
                  run(async () => {
                    await authenticate();
                  })
                }
              >
                {t('vault.authenticate')}
              </Button>
            )}
            {session?.stage === 'MFA' && !maintenance && (
              <Button
                disabled={busy}
                onClick={() => {
                  navigate(() => {
                    lock();
                    setMaintenance(true);
                    active.current = true;
                    lastActivity.current = Date.now();
                  });
                }}
              >
                {t('manage.title')}
              </Button>
            )}
            {unlocked && (
              <Button
                aria-label={t('vault.lock')}
                title={t('vault.lock')}
                onClick={() => lock(true)}
              >
                <LockKeyhole size={16} strokeWidth={1.5} />
                <span className={styles.lockLabel}>{t('vault.lock')}</span>
              </Button>
            )}
            {unlocked && (
              <Button
                className={styles.workspaceExtra}
                type="text"
                disabled={busy || !!editor}
                aria-label={t('vault.refresh')}
                onClick={() =>
                  run(async () => {
                    await sync();
                  })
                }
                icon={<RefreshCw size={16} strokeWidth={1.5} />}
              />
            )}
            <Button
              className={unlocked ? styles.workspaceExtra : undefined}
              aria-label={t(
                dark ? 'vault.switchToLight' : 'vault.switchToDark',
              )}
              type="text"
              title={t(dark ? 'vault.switchToLight' : 'vault.switchToDark')}
              onClick={toggleTheme}
              icon={
                dark ? (
                  <Sun size={16} strokeWidth={1.5} />
                ) : (
                  <Moon size={16} strokeWidth={1.5} />
                )
              }
            />
            {session?.stage && (
              <Button
                className={unlocked ? styles.workspaceExtra : undefined}
                type="text"
                aria-label={t('vault.logout')}
                onClick={() => navigate(switchAccount)}
                icon={<LogOut size={16} strokeWidth={1.5} />}
              />
            )}
            {unlocked && (
              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                menu={{
                  items: [
                    {
                      key: 'language',
                      type: 'group',
                      label: t('vault.language'),
                      children: [
                        { key: 'zh-CN', label: '简体中文' },
                        { key: 'zh-TW', label: '繁體中文' },
                        { key: 'en-US', label: 'English' },
                      ],
                    },
                    {
                      key: 'theme',
                      label: t(
                        dark ? 'vault.switchToLight' : 'vault.switchToDark',
                      ),
                    },
                    {
                      key: 'refresh',
                      label: t('vault.refresh'),
                      disabled: busy,
                    },
                    { key: 'logout', label: t('vault.logout') },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'theme') toggleTheme();
                    else if (key === 'refresh')
                      navigate(() =>
                        run(async () => {
                          await sync();
                        }),
                      );
                    else if (key === 'logout') navigate(switchAccount);
                    else
                      navigate(() => {
                        lock();
                        setLocale(key, false);
                      });
                  },
                }}
              >
                <Button
                  className={styles.workspaceMenu}
                  aria-label={t('entries.moreActions')}
                  icon={<Ellipsis size={18} />}
                />
              </Dropdown>
            )}
          </div>
        </header>
        {completion && completion.ownerSubject === session?.ownerSubject && (
          <div className={styles.errorBanner}>
            <Alert
              type={completionVerified ? 'success' : 'info'}
              showIcon
              title={t(
                completionVerified
                  ? completion.mode === 'RESTORE'
                    ? 'manage.restoreVerified'
                    : 'manage.rotationVerified'
                  : 'manage.restoreLastCheck',
              )}
            />
          </div>
        )}
        {error && (
          <div className={styles.errorBanner}>
            <Alert
              type="error"
              showIcon
              title={errorText()}
              action={
                <Button
                  size="small"
                  onClick={() => {
                    if (
                      !session ||
                      (session.stage !== 'MFA' && !authMode) ||
                      (session.stage === 'MFA' && !meta) ||
                      error.includes('CSRF') ||
                      error === 'VAULT_ORIGIN_REJECTED'
                    ) {
                      lock();
                      run(async () => {
                        await loadSession();
                      });
                    } else setError('');
                  }}
                >
                  {t('vault.dismiss')}
                </Button>
              }
            />
          </div>
        )}
        {maintenance && session?.stage === 'MFA' && (
          <Maintenance
            client={client}
            busy={busy}
            ownerSubject={session.ownerSubject || ''}
            guard={guard}
            run={run}
            onExit={() => {
              lock();
              run(async () => {
                await loadSession();
              });
            }}
            onSessionChanged={(receipt) => {
              if (receipt) {
                rememberCompletion(receipt);
                setCompletion(receipt);
                setCompletionVerified(false);
              }
              lock(true);
              clearSession();
              setSession(undefined);
              setMeta(undefined);
              run(async () => {
                await loadSession();
              });
            }}
          />
        )}
        {!unlocked && !maintenance && (
          <AuthShell
            wide={!!draft}
            step={session?.stage === 'MFA' ? 2 : session?.stage ? 1 : 0}
          >
            {!session && (
              <Button
                loading={busy}
                onClick={() =>
                  run(async () => {
                    await loadSession();
                  })
                }
              >
                {t('vault.connect')}
              </Button>
            )}
            {session && session.stage !== 'MFA' && (
              <Auth
                key={revision}
                session={session}
                mode={authMode}
                onSwitchAccount={switchAccount}
                busy={busy}
                codes={codes}
                onFileError={fileError}
                onLogin={(username, password) =>
                  run(async () => {
                    await guard(auth.login(username, password));
                    channel.current?.postMessage('logout');
                    await loadSession();
                  })
                }
                onAuthenticate={() =>
                  run(async () => {
                    await authenticate();
                  })
                }
                onRegister={(label) =>
                  run(async () => {
                    const options = await guard(auth.registerOptions());
                    const credential = await guard(createPasskey(options));
                    await guard(auth.register(label, credential));
                    await loadSession();
                    setAuthMode('registered');
                  })
                }
                onRecover={(code) =>
                  run(async () => {
                    await guard(auth.recoverMFA(code));
                    channel.current?.postMessage('logout');
                    await loadSession();
                  })
                }
                onIssue={() =>
                  run(async () => {
                    const current = await loadSession();
                    assert(current.credentialRevision);
                    setCodes(
                      await guard(auth.issueCodes(current.credentialRevision)),
                    );
                    active.current = true;
                  })
                }
                onConfirm={(text) =>
                  run(async () => {
                    assert(codes);
                    const file = object(JSON.parse(text));
                    assert(
                      file.formatVersion === 1 &&
                        file.batchId === codes.batchId &&
                        file.ownerSubject === session.ownerSubject &&
                        Array.isArray(file.codes) &&
                        file.codes.length === codes.codes.length &&
                        file.codes.every(
                          (code, index) => code === codes.codes[index],
                        ),
                    );
                    await guard(
                      auth.confirmCodes(
                        codes.batchId,
                        codes.credentialRevision,
                      ),
                    );
                    setCodes(undefined);
                    active.current = false;
                    await loadSession();
                  })
                }
              />
            )}
            {session?.stage === 'MFA' && !meta && (
              <div className="grid gap-4">
                <p role="status">
                  {t(busy ? 'vault.loadingMeta' : 'vault.metaUnavailable')}
                </p>
                <Button
                  loading={busy}
                  onClick={() =>
                    run(async () => {
                      await loadSession();
                    })
                  }
                >
                  {t('vault.refresh')}
                </Button>
              </div>
            )}
            {session?.stage === 'MFA' &&
              meta &&
              !meta.initialized &&
              meta.status !== 'RESTORING' && (
                <Setup
                  key={revision}
                  busy={busy}
                  draft={draft}
                  verified={verified}
                  onFileError={fileError}
                  onCancel={() => lock()}
                  onPrepare={(password) =>
                    run(async () => {
                      assert(session.ownerSubject);
                      active.current = true;
                      const result = await guard(
                        client.call('prepare', {
                          ownerSubject: session.ownerSubject,
                          password,
                          vaultId: meta.vaultId,
                        }),
                      );
                      setDraft(result);
                    })
                  }
                  onVerify={(account, recovery) =>
                    run(async () => {
                      setVerified(false);
                      await guard(
                        client.call('verifyFiles', { account, recovery }),
                      );
                      setVerified(true);
                    })
                  }
                  onCommit={() =>
                    run(async () => {
                      const payload = await guard(
                        client.call('setupPayload', {}),
                      );
                      setupKey.current ||= crypto.randomUUID();
                      let current = await loadMeta();
                      if (!current.initialized) {
                        try {
                          await guard(
                            vaultAPI.initialize({
                              ...payload,
                              idempotencyKey: setupKey.current,
                            }),
                          );
                        } catch (failure) {
                          if (
                            !(failure instanceof VaultHttpError) ||
                            failure.status !== 0
                          )
                            throw failure;
                        }
                        current = await loadMeta();
                      }
                      assert(current.initialized && session.ownerSubject);
                      await guard(
                        client.call('finishSetup', {
                          meta: current,
                          ownerSubject: session.ownerSubject,
                        }),
                      );
                      setDraft(undefined);
                      setVerified(false);
                      setUnlocked(true);
                      await sync(current);
                    })
                  }
                />
              )}
            {session?.stage === 'MFA' && meta?.status === 'RESTORING' && (
              <Alert type="warning" title={t('vault.writeLocked')} />
            )}
            {session?.stage === 'MFA' &&
              meta?.initialized &&
              meta.status !== 'RESTORING' &&
              !unlocked && (
                <Unlock
                  key={revision}
                  busy={busy}
                  meta={meta}
                  ownerSubject={session.ownerSubject || ''}
                  onSwitchAccount={switchAccount}
                  onUnlock={(account, password) =>
                    run(async () => {
                      assert(session.ownerSubject);
                      active.current = true;
                      const current = await loadMeta();
                      await guard(
                        client.call('unlock', {
                          ownerSubject: session.ownerSubject,
                          meta: current,
                          account,
                          password,
                        }),
                      );
                      try {
                        await sync(current);
                        setUnlocked(true);
                      } catch (failure) {
                        client.reset();
                        active.current = false;
                        throw failure;
                      }
                    })
                  }
                />
              )}
          </AuthShell>
        )}
        {unlocked && (
          <Items
            key={revision}
            editorRef={editorRef}
            onNotes={async (itemId) => {
              check();
              const serial = exposure.current;
              assert(
                active.current &&
                  !document.hidden &&
                  selectedRef.current === itemId,
              );
              const value = await guard(client.call('notes', { itemId }));
              assert(
                serial === exposure.current &&
                  !document.hidden &&
                  selectedRef.current === itemId,
              );
              return value;
            }}
            onExport={async (itemId, signal) => {
              const serial = exposure.current;
              const valid = () =>
                active.current &&
                !signal.aborted &&
                !document.hidden &&
                selectedRef.current === itemId &&
                serial === exposure.current;
              assert(valid());
              await exportSession();
              assert(valid());
              // A fresh Passkey assertion gives this 60s export a known authentication age.
              const options = await guard(auth.authenticateOptions());
              const credential = await guard(getPasskey(options, signal));
              assert(valid());
              await guard(auth.authenticate(credential));
              const current = await exportSession();
              assert(valid() && current.recentAuthentication === true);
              const uri = await guard(
                client.call('exportTotp', {
                  itemId,
                  session: current,
                  checkedAt: Date.now(),
                }),
              );
              assert(valid());
              return uri;
            }}
            onDraftCode={async (config) => {
              check();
              const serial = exposure.current;
              assert(active.current && !document.hidden);
              const value = await guard(client.call('draftCode', { config }));
              assert(serial === exposure.current && !document.hidden);
              return value;
            }}
            onCode={async (itemId) => {
              check();
              assert(
                active.current &&
                  !document.hidden &&
                  selectedRef.current === itemId,
              );
              return guard(client.call('code', { itemId }));
            }}
            securityPanel={
              <Button
                onClick={() => {
                  lock();
                  setMaintenance(true);
                  active.current = true;
                  lastActivity.current = Date.now();
                }}
              >
                {t('manage.title')}
              </Button>
            }
            rows={rows}
            allRows={allRows}
            selected={selected}
            onSelect={select}
            revealUntil={revealUntil}
            copyFallback={copyFallback}
            syncFailed={syncFailed}
            conflict={error === 'VAULT_VERSION_CONFLICT'}
            busy={busy}
            query={query}
            detail={detail}
            editor={editor}
            uncertain={uncertain}
            onCloseEditor={closeEditor}
            onCloseDetail={hideDetail}
            onSearch={(value) => {
              try {
                check();
              } catch {
                return;
              }
              hideDetail();
              setQuery(value);
              const serial = ++searchSerial.current;
              clearTimeout(searchTimer.current);
              searchTimer.current = setTimeout(() => {
                if (!active.current || inFlight.current) return;
                void guard(client.call('search', { query: value }))
                  .then((result) => {
                    if (serial === searchSerial.current) setRows(result);
                  })
                  .catch(() => {});
              }, 120);
            }}
            onNew={() => {
              try {
                check();
                hideDetail();
                setEditor({ plain: emptyItem() });
              } catch {
                /* The expiry check already locked the page. */
              }
            }}
            onReveal={(itemId) => {
              hideDetail();
              const serial = exposure.current;
              run(async () => {
                const value = await guard(client.call('reveal', { itemId }));
                if (
                  serial !== exposure.current ||
                  selectedRef.current !== itemId ||
                  document.hidden
                )
                  return;
                setDetail(value);
                setRevealUntil(Date.now() + 20000);
                revealTimer.current = setTimeout(hideDetail, 20000);
              });
            }}
            onCopy={(itemId) => {
              hideDetail();
              const serial = exposure.current;
              run(async () => {
                const value = await guard(client.call('reveal', { itemId }));
                if (
                  serial !== exposure.current ||
                  selectedRef.current !== itemId ||
                  document.hidden
                )
                  return;
                await copyText(value.password, serial);
              });
            }}
            onCopyText={(value) => {
              hideDetail();
              const serial = exposure.current;
              run(async () => {
                await copyText(value, serial);
              });
            }}
            onEdit={(itemId, totpAction) => {
              conceal();
              const serial = exposure.current;
              run(async () => {
                const plain = await guard(client.call('reveal', { itemId }));
                if (serial !== exposure.current || document.hidden) return;
                setEditor({
                  itemId,
                  plain,
                  hasTotp: allRows.find((row) => row.itemId === itemId)
                    ?.hasTotp,
                  totpInfo: allRows.find((row) => row.itemId === itemId)
                    ?.totpInfo,
                  totpAction,
                });
              });
            }}
            onReload={() =>
              run(async () => {
                const itemId = editor?.itemId;
                closeEditor();
                await sync();
                if (itemId && selectedRef.current === itemId) {
                  const serial = exposure.current;
                  const plain = await guard(client.call('reveal', { itemId }));
                  if (serial === exposure.current && !document.hidden)
                    setEditor({
                      itemId,
                      plain,
                      hasTotp: allRows.find((row) => row.itemId === itemId)
                        ?.hasTotp,
                      totpInfo: allRows.find((row) => row.itemId === itemId)
                        ?.totpInfo,
                    });
                }
              })
            }
            onGenerate={(length, symbols, set) => {
              const serial = exposure.current;
              run(async () => {
                const password = await guard(
                  client.call('generate', { length, symbols }),
                );
                if (serial === exposure.current && !document.hidden)
                  set(password);
              });
            }}
            onSave={(plain, preserveTotp) =>
              run(async () => {
                assert(editor);
                const value =
                  pendingWrite.current ||
                  (await guard(
                    client.call('encrypt', {
                      plain,
                      itemId: editor.itemId,
                      preserveTotp,
                    }),
                  ));
                pendingWrite.current = value;
                setUncertain(true);
                await guard(
                  editor.itemId
                    ? itemAPI.updateItem(value)
                    : itemAPI.createItem(value),
                );
                closeEditor();
                message.success(t('vault.saved'));
                await sync(undefined, value.itemId);
              })
            }
            onDelete={(itemId) =>
              run(async () => {
                assert(meta?.generation);
                const row = rows.find((value) => value.itemId === itemId);
                assert(row);
                const idempotencyKey =
                  deleteKeys.current.get(itemId) || crypto.randomUUID();
                deleteKeys.current.set(itemId, idempotencyKey);
                await guard(
                  itemAPI.deleteItem({
                    itemId,
                    generation: meta.generation,
                    expectedRowVersion: row.rowVersion,
                    idempotencyKey,
                  }),
                );
                closeEditor();
                message.success(t('vault.deleted'));
                await sync();
              })
            }
          />
        )}
        <footer className={styles.footer}>
          <ShieldCheck size={16} strokeWidth={1.5} />
          <span>{t(unlocked ? 'vault.workspaceFoot' : 'vault.localOnly')}</span>
          <span className={styles.footerEnd}>
            {t('vault.lockHint', VAULT_AUTO_LOCK)}
          </span>
        </footer>
      </div>
    </main>
  );
}

export default function VaultPage() {
  return (
    <VaultTheme>
      <VaultWorkspace />
    </VaultTheme>
  );
}
