import { useQueryClient } from '@tanstack/react-query';
import { getLocale, setLocale } from '@umijs/max';
import { Alert, App, Button, Select, Space } from 'antd';
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
import * as auth from '@/services/vault/session';
import * as vaultAPI from '@/services/vault/vault';
import Auth from './Auth';
import Items, { type Editor } from './Items';
import Setup from './Setup';
import { useText } from './text';
import Unlock from './Unlock';

const emptyItem = (): Vault.PlainItem => ({
  title: '',
  website: '',
  username: '',
  password: '',
  notes: '',
  tags: [],
});

export default function VaultPage() {
  const t = useText();
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
  const [rows, setRows] = useState<Vault.Summary[]>([]);
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Vault.PlainItem>();
  const [editor, setEditor] = useState<Editor>();
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
    setDetail(undefined);
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
    if (result.stage === 'MFA') await loadMeta();
    return result;
  }
  async function loadMeta() {
    const value = await guard(vaultAPI.meta());
    setMeta(value);
    return value;
  }
  async function sync(value?: Vault.Meta) {
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
    setRows(await guard(client.call('search', { query: '' })));
    deleteKeys.current.clear();
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
    setEditor(undefined);
    pendingWrite.current = undefined;
    setUncertain(false);
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 md:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-emerald-800">
            MINI ERP
          </p>
          <h1 className="m-0 text-3xl font-semibold tracking-tight">
            {t('vault.title')}
          </h1>
          <p className="mt-2 text-slate-500">{t('vault.subtitle')}</p>
        </div>
        <Space wrap>
          <Select
            aria-label={t('vault.language')}
            value={getLocale()}
            onChange={(locale: string) => {
              lock();
              setLocale(locale, false);
            }}
            options={[
              { value: 'zh-CN', label: '简体中文' },
              { value: 'zh-TW', label: '繁體中文' },
              { value: 'en-US', label: 'English' },
            ]}
          />
          {session?.stage === 'MFA' && (
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
          {session?.stage && (
            <Button
              onClick={() => {
                lock(true);
              }}
            >
              {t('vault.lock')}
            </Button>
          )}
          {session?.stage && (
            <Button
              onClick={() => {
                lock(true);
                run(async () => {
                  await guard(auth.logout());
                  clearSession();
                  channel.current?.postMessage('logout');
                  setSession(undefined);
                  setMeta(undefined);
                  await loadSession();
                });
              }}
            >
              {t('vault.logout')}
            </Button>
          )}
        </Space>
      </header>
      <div className="mb-6">
        <Alert type="warning" showIcon title={t('vault.previewNotice')} />
      </div>
      {error && (
        <div className="mb-6">
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
                auth.confirmCodes(codes.batchId, codes.credentialRevision),
              );
              setCodes(undefined);
              active.current = false;
              await loadSession();
            })
          }
        />
      )}
      {session?.stage === 'MFA' && !meta && (
        <Space orientation="vertical">
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
        </Space>
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
                await guard(client.call('verifyFiles', { account, recovery }));
                setVerified(true);
              })
            }
            onCommit={() =>
              run(async () => {
                const payload = await guard(client.call('setupPayload', {}));
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
      {session?.stage === 'MFA' && meta?.initialized && !unlocked && (
        <Unlock
          key={revision}
          busy={busy}
          onFileError={fileError}
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
      {unlocked && (
        <Items
          key={revision}
          rows={rows}
          busy={busy}
          query={query}
          detail={detail}
          editor={editor}
          uncertain={uncertain}
          onCloseEditor={closeEditor}
          onCloseDetail={() => {
            setDetail(undefined);
            clearTimeout(revealTimer.current);
          }}
          onSearch={(value) => {
            try {
              check();
            } catch {
              return;
            }
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
          onRefresh={() =>
            run(async () => {
              closeEditor();
              await sync();
            })
          }
          onNew={() => {
            try {
              check();
              setEditor({ plain: emptyItem() });
            } catch {
              /* The expiry check already locked the page. */
            }
          }}
          onReveal={(itemId) =>
            run(async () => {
              conceal();
              const value = await guard(client.call('reveal', { itemId }));
              assert(!document.hidden);
              setDetail(value);
              revealTimer.current = setTimeout(
                () => setDetail(undefined),
                20000,
              );
            })
          }
          onCopy={(itemId) =>
            run(async () => {
              const value = await guard(client.call('reveal', { itemId }));
              assert(!document.hidden);
              await guard(navigator.clipboard.writeText(value.password));
              message.success(t('vault.copied'));
            })
          }
          onEdit={(itemId) =>
            run(async () => {
              conceal();
              const plain = await guard(client.call('reveal', { itemId }));
              assert(!document.hidden);
              setEditor({ itemId, plain });
            })
          }
          onGenerate={(set) =>
            run(async () => {
              const password = await guard(client.call('generate', {}));
              assert(!document.hidden);
              set(password);
            })
          }
          onSave={(plain) =>
            run(async () => {
              assert(editor);
              const value =
                pendingWrite.current ||
                (await guard(
                  client.call('encrypt', { plain, itemId: editor.itemId }),
                ));
              pendingWrite.current = value;
              setUncertain(true);
              await guard(
                editor.itemId
                  ? itemAPI.updateItem(value)
                  : itemAPI.createItem(value),
              );
              closeEditor();
              await sync();
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
              await sync();
            })
          }
        />
      )}
      <p className="mt-8 text-center text-xs text-slate-500">
        {t('vault.lockHint', VAULT_AUTO_LOCK)}
      </p>
    </main>
  );
}
