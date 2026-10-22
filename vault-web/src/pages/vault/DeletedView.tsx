import { Alert, App, Button, Input, Modal } from 'antd';
import {
  ArrowLeft,
  CheckCircle2,
  ClockAlert,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { VaultClient } from '@/security/vault/client';
import { RetentionClock } from '@/security/vault/lifecycle';
import { assert } from '@/security/vault/protocol';
import { VaultHttpError } from '@/services/httpClient';
import * as api from '@/services/vault/item';
import { trapDialogTab } from './dialog';
import s from './Entries.module.css';
import EntryDetail from './EntryDetail';
import { type MessageKey, useText } from './text';
import v from './Vault.module.css';

export default function DeletedView(props: {
  rows: Vault.DeletedSummary[];
  serverNow: () => number;
  client: VaultClient;
  guard: <T>(promise: Promise<T>) => Promise<T>;
  onSync: () => Promise<unknown>;
  onForget: (id: string) => void;
  onNormal: (id?: string) => void;
  onBlocked: (value: boolean) => void;
}) {
  const t = useText();
  const { message } = App.useApp();
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(props.rows);
  const [selected, setSelected] = useState<string>();
  const [verified, setVerified] = useState<Vault.DeletedDetail>();
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{
    action: 'restore' | 'purge';
    request: Vault.LifecycleRequest;
  }>();
  const [error, setError] = useState<MessageKey>();
  const [result, setResult] = useState<'restore' | 'purge'>();
  const [restoredId, setRestoredId] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const [plain, setPlain] = useState<Vault.PlainItem>();
  const [fallback, setFallback] = useState<string>();
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(props.serverNow);
  const [viewVersion, setViewVersion] = useState(0);
  const sequence = useRef(0);
  const mounted = useRef(true);
  const currentId = useRef<string | undefined>(undefined);
  const submitting = useRef(false);
  const clock = useRef(new RetentionClock()).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const live = useRef({ selected, verified, pending });
  live.current = { selected, verified, pending };
  const hide = () => {
    sequence.current++;
    setPlain(undefined);
    setFallback(undefined);
    setUntil(0);
    clearTimeout(timer.current);
  };
  const invalidate = (message: MessageKey) => {
    hide();
    setVerified(undefined);
    setConfirm(false);
    setViewVersion((value) => value + 1);
    setError(message);
    const id = currentId.current;
    if (id) {
      props.onForget(id);
      void props
        .guard(props.client.call('forgetDeleted', { itemId: id }))
        .catch(() => {});
    }
  };
  const failure = (value: unknown) => {
    const code =
      value instanceof VaultHttpError
        ? value.code
        : value instanceof Error
          ? value.message
          : '';
    if (code === 'VAULT_ITEM_EXPIRED') invalidate('deleted.expired');
    else if (code === 'VAULT_NOT_FOUND') invalidate('deleted.notFound');
    else if (
      code === 'VAULT_ITEM_NOT_DELETED' ||
      code === 'VAULT_VERSION_CONFLICT'
    ) {
      invalidate('deleted.conflict');
      void props.onSync().catch(() => {});
    } else
      setError(
        code === 'VAULT_ITEM_LIMIT_REACHED'
          ? 'deleted.capacity'
          : code === 'VAULT_WRITE_LOCKED'
            ? 'deleted.writeLocked'
            : 'vault.requestFailed',
      );
  };
  const check = async (
    id: string,
    baseline: Vault.DeletedDetail | null = live.current.verified || null,
  ) => {
    const ticket = sequence.current;
    const started = performance.now();
    const value = await props.guard(api.deletedDetail(id));
    assert(
      mounted.current &&
        currentId.current === id &&
        !document.hidden &&
        ticket === sequence.current,
    );
    if (
      baseline &&
      baseline.itemId === id &&
      (baseline.generation !== value.generation ||
        baseline.rowVersion !== value.rowVersion)
    )
      throw new VaultHttpError(409, 'VAULT_VERSION_CONFLICT');
    clock.calibrate(value.serverTime, started);
    if (clock.now() >= Date.parse(value.purgeAt))
      throw new VaultHttpError(409, 'VAULT_ITEM_EXPIRED');
    // The Worker validates the decrypted type as well as the deadline.
    await props.guard(
      props.client.call('ingestDeleted', {
        items: [value],
        serverTime: new Date(clock.now()).toISOString(),
      }),
    );
    assert(
      mounted.current &&
        currentId.current === id &&
        !document.hidden &&
        ticket === sequence.current,
    );
    setVerified(value);
    setNow(clock.now());
    return value;
  };
  const open = async (id: string) => {
    if (submitting.current || live.current.pending) return;
    hide();
    currentId.current = id;
    setSelected(id);
    setVerified(undefined);
    setError(undefined);
    setResult(undefined);
    setChecking(true);
    const ticket = sequence.current;
    try {
      await check(id, null);
    } catch (value) {
      if (
        mounted.current &&
        currentId.current === id &&
        ticket === sequence.current
      )
        failure(value);
    } finally {
      if (mounted.current && ticket === sequence.current) setChecking(false);
    }
  };
  useEffect(() => {
    let cancelled = false;
    void props
      .guard(props.client.call('searchDeleted', { query }))
      .then((value) => {
        if (!cancelled) setRows(value);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [query, props.rows]);
  useEffect(() => {
    mounted.current = true;
    const recheck = () => {
      hide();
      setVerified(undefined);
      setConfirm(false);
      setViewVersion((value) => value + 1);
      const id = currentId.current;
      if (
        id &&
        !document.hidden &&
        !submitting.current &&
        !live.current.pending
      )
        void open(id);
    };
    const tick = () => {
      setNow(props.serverNow());
      const value = live.current.verified;
      if (!value) return;
      if (clock.needsConfirmation()) {
        recheck();
        return;
      }
      const time = clock.now();
      setNow(time);
      if (time >= Date.parse(value.purgeAt)) invalidate('deleted.expired');
    };
    const interval = setInterval(tick, 250);
    document.addEventListener('visibilitychange', recheck);
    window.addEventListener('focus', recheck);
    window.addEventListener('pageshow', recheck);
    return () => {
      mounted.current = false;
      sequence.current++;
      clearTimeout(timer.current);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', recheck);
      window.removeEventListener('focus', recheck);
      window.removeEventListener('pageshow', recheck);
    };
  }, []);
  const sensitive = async <T,>(id: string, action: () => Promise<T>) => {
    const ticket = sequence.current;
    try {
      await check(id);
      const value = await props.guard(action());
      assert(
        mounted.current &&
          ticket === sequence.current &&
          !document.hidden &&
          currentId.current === id &&
          clock.now() <
            Date.parse(
              live.current.verified?.purgeAt || verified?.purgeAt || '',
            ),
      );
      return value;
    } catch (value) {
      if (mounted.current && ticket === sequence.current) failure(value);
      throw value;
    }
  };
  const copy = async (value: string) => {
    const ticket = sequence.current;
    try {
      await props.guard(navigator.clipboard.writeText(value));
      if (mounted.current && ticket === sequence.current && !document.hidden)
        message.success(t('vault.copied'));
    } catch {
      if (ticket !== sequence.current || document.hidden) return;
      setFallback(value);
      timer.current = setTimeout(hide, 20000);
    }
  };
  const submit = async (action: 'restore' | 'purge', retry = pending) => {
    if (submitting.current || !currentId.current) return;
    submitting.current = true;
    setBusy(true);
    setConfirm(false);
    hide();
    setViewVersion((value) => value + 1);
    let operation = retry;
    try {
      if (!operation) {
        const value = await check(currentId.current);
        operation = {
          action,
          request: {
            itemId: value.itemId,
            generation: value.generation,
            expectedRowVersion: value.rowVersion,
            idempotencyKey: crypto.randomUUID(),
          },
        };
      } else {
        // A state query cannot prove the outcome of this request. Replay the exact
        // request to retrieve its durable receipt, even if detail is now 404.
        try {
          await props.guard(api.deletedDetail(operation.request.itemId));
        } catch (value) {
          if (
            !(value instanceof VaultHttpError) ||
            ![404, 409].includes(value.status)
          )
            throw value;
        }
      }
      setPending(operation);
      await props.guard(api.lifecycle(operation.action, operation.request));
      if (!mounted.current) return;
      props.onForget(operation.request.itemId);
      await props.guard(
        props.client.call('forgetDeleted', {
          itemId: operation.request.itemId,
        }),
      );
      setPending(undefined);
      setVerified(undefined);
      setSelected(undefined);
      currentId.current = undefined;
      setError(undefined);
      setRestoredId(
        operation.action === 'restore' ? operation.request.itemId : undefined,
      );
      setResult(operation.action);
      // Always read current state after a receipt (including historical replay).
      await props.onSync().catch(() => {
        if (mounted.current) setError('vault.requestFailed');
      });
    } catch (value) {
      if (!mounted.current) return;
      if (
        operation &&
        (!(value instanceof VaultHttpError) ||
          value.status === 0 ||
          value.status >= 500)
      ) {
        setPending(operation);
        setError('deleted.unknown');
      } else {
        setPending(undefined);
        failure(value);
      }
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  useEffect(() => {
    props.onBlocked(busy || !!pending);
    return () => props.onBlocked(false);
  }, [busy, pending]);
  const row = rows.find((value) => value.itemId === selected);
  const blocked = busy || !!pending || checking || !verified;
  const format = (time: string) => {
    const date = new Date(time);
    const pad = (value: number) => String(value).padStart(2, '0');
    const offset = -date.getTimezoneOffset();
    const zone = `GMT${offset >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${zone}`;
  };
  const back = () => {
    if (pending || busy) return;
    hide();
    currentId.current = undefined;
    setSelected(undefined);
    setVerified(undefined);
  };
  const feedback = (
    <>
      {error && (
        <Alert
          type={error === 'deleted.unknown' ? 'info' : 'warning'}
          title={t(error)}
          action={
            error === 'deleted.capacity' ? (
              <Button onClick={() => props.onNormal()}>
                {t('deleted.viewAll')}
              </Button>
            ) : undefined
          }
        />
      )}
      {pending && (
        <Button
          disabled={busy}
          onClick={() => void submit(pending.action, pending)}
        >
          {t('deleted.queryRetry')}
        </Button>
      )}
      {!pending && error && (
        <Button
          disabled={busy}
          onClick={() => (selected ? void open(selected) : void props.onSync())}
        >
          {t('vault.refresh')}
        </Button>
      )}
    </>
  );
  return (
    <div className={`${s.split} ${selected || result ? s.mobileDetail : ''}`}>
      <section className={s.list} aria-label={t('deleted.title')}>
        <div className={s.listHead}>
          <h1>{t('deleted.title')}</h1>
          <span>{props.rows.length}</span>
        </div>
        <p className={s.deletedIntro}>{t('deleted.intro')}</p>
        <div className={s.search}>
          <Input
            value={query}
            maxLength={1024}
            disabled={!!pending || busy}
            prefix={<Search size={17} />}
            placeholder={t('deleted.search')}
            aria-label={t('deleted.search')}
            allowClear
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <p className={v.listCaption}>
          {t('deleted.count', { count: rows.length })}
        </p>
        <div className={s.entries}>
          {rows.map((item) => (
            <button
              type="button"
              key={item.itemId}
              className={`${v.item} ${item.itemId === selected ? v.selected : ''}`}
              disabled={!!pending || busy}
              aria-current={item.itemId === selected ? 'true' : undefined}
              onClick={() => void open(item.itemId)}
            >
              <span className={v.itemIcon}>{Array.from(item.title)[0]}</span>
              <span className={v.itemText}>
                <b>{item.title}</b>
                <small>{item.username || item.website}</small>
                <small className={s.remaining}>
                  {Date.parse(item.purgeAt) - now < 86400000
                    ? t('deleted.lessDay')
                    : t('deleted.days', {
                        days: Math.max(
                          1,
                          Math.ceil(
                            (Date.parse(item.purgeAt) - now) / 86400000,
                          ),
                        ),
                      })}
                </small>
              </span>
            </button>
          ))}
          {!rows.length && (
            <div className={v.empty}>
              {t(query ? 'deleted.noResults' : 'deleted.empty')}
            </div>
          )}
        </div>
      </section>
      <section className={s.detail} aria-label={t('vault.detailPanel')}>
        {row && verified && !checking ? (
          <EntryDetail
            key={`${row.itemId}:${viewVersion}`}
            readonly
            row={row}
            busy={blocked}
            deleteImpact=""
            detail={plain}
            revealUntil={until}
            copyFallback={fallback}
            onBack={back}
            onCloseDetail={hide}
            lifecycleActions={
              <div className={s.lifecycleActions}>
                <Button
                  type="primary"
                  disabled={blocked}
                  icon={<RotateCcw size={16} />}
                  onClick={() => void submit('restore')}
                >
                  {t('deleted.restore')}
                </Button>
                <Button
                  danger
                  disabled={blocked}
                  onClick={() => {
                    hide();
                    setConfirm(true);
                  }}
                >
                  {t('deleted.purge')}
                </Button>
              </div>
            }
            lifecycleHeader={
              <>
                <div className={s.deadline} role="status">
                  <ClockAlert size={19} />
                  <div>
                    <p>
                      {t('deleted.deadline', {
                        time: format(verified.purgeAt),
                      })}
                    </p>
                    <p>
                      {t('deleted.deletedAt', {
                        time: format(verified.deletedAt),
                      })}
                    </p>
                  </div>
                </div>
                {feedback}
                <p className={s.deletedReadonly}>{t('deleted.readonlyHint')}</p>
              </>
            }
            onReveal={(id) => {
              hide();
              void sensitive(id, () =>
                props.client.call('reveal', { itemId: id, deleted: true }),
              )
                .then((value) => {
                  setPlain(value);
                  setUntil(Date.now() + 20000);
                  timer.current = setTimeout(hide, 20000);
                })
                .catch(() => {});
            }}
            onCopy={(id) => {
              hide();
              void sensitive(id, () =>
                props.client.call('reveal', { itemId: id, deleted: true }),
              )
                .then((value) => copy(value.password))
                .catch(() => {});
            }}
            onCopyText={(value) => {
              hide();
              void sensitive(row.itemId, () => Promise.resolve(value))
                .then(copy)
                .catch(() => {});
            }}
            onNotes={(id) =>
              sensitive(id, () =>
                props.client.call('notes', { itemId: id, deleted: true }),
              )
            }
            onCode={(id) =>
              sensitive(id, () =>
                props.client.call('code', { itemId: id, deleted: true }),
              )
            }
            onExport={async () => {
              throw new Error('VAULT_READ_ONLY');
            }}
            onEdit={() => setError('deleted.readonlyHint')}
            onDelete={() => setError('deleted.readonlyHint')}
          />
        ) : (
          <div className={s.detailContent}>
            <Button
              className={s.back}
              type="link"
              disabled={busy || !!pending}
              icon={<ArrowLeft size={16} />}
              onClick={() => {
                back();
                setResult(undefined);
              }}
            >
              {t('vault.backList')}
            </Button>
            {checking ? (
              <p role="status">{t('deleted.checking')}</p>
            ) : result ? (
              <div className={v.empty} role="status">
                <span className="mx-auto mb-4 block w-fit">
                  {result === 'restore' ? (
                    <CheckCircle2 size={26} />
                  ) : (
                    <Trash2 size={26} />
                  )}
                </span>
                <h2>
                  {t(
                    result === 'restore'
                      ? 'deleted.restored'
                      : 'deleted.purged',
                  )}
                </h2>
                <p>
                  {t(
                    result === 'restore'
                      ? 'deleted.restoredHint'
                      : 'deleted.purgedHint',
                  )}
                </p>
                {restoredId && (
                  <Button onClick={() => props.onNormal(restoredId)}>
                    {t('deleted.viewRestored')}
                  </Button>
                )}
              </div>
            ) : (
              !error && (
                <div className={v.empty}>
                  {t(
                    props.rows.length ? 'entries.selectItem' : 'deleted.empty',
                  )}
                </div>
              )
            )}
            {feedback}
          </div>
        )}
      </section>
      {confirm && verified && (
        <Modal
          open
          title={t('deleted.purgeTitle')}
          className={s.dialog}
          getContainer={false}
          destroyOnHidden
          mask={{ closable: false }}
          focusable={{ trap: true, focusTriggerAfterClose: true }}
          modalRender={(node) => (
            <div role="presentation" onKeyDownCapture={trapDialogTab}>
              {node}
            </div>
          )}
          cancelButtonProps={{ autoFocus: true }}
          cancelText={t('vault.cancel')}
          okText={t('deleted.purge')}
          okButtonProps={{ danger: true, disabled: blocked }}
          onCancel={() => setConfirm(false)}
          onOk={() => void submit('purge')}
        >
          <p>{row?.title}</p>
          <p>{t('deleted.purgeWarning')}</p>
        </Modal>
      )}
    </div>
  );
}
