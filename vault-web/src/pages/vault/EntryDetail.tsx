import { Button, Modal } from 'antd';
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  QrCode,
  ScanLine,
  Trash2,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { totpTransferLabels } from '@/security/vault/totp';
import { trapDialogTab } from './dialog';
import styles from './Entries.module.css';
import TotpTransferDialog from './TotpTransferDialog';
import TotpView from './TotpView';
import { useText } from './text';

export type DetailActions = {
  onCode: (id: string) => Promise<Vault.TotpCode>;
  onNotes: (id: string) => Promise<string>;
  onExport: (id: string, signal: AbortSignal) => Promise<string>;
  onReveal: (id: string) => void;
  onCopy: (id: string) => void;
  onCopyText: (value: string) => void;
  onEdit: (id: string, action?: 'replace' | 'remove') => void;
  onDelete: (id: string) => void;
  onCloseDetail: () => void;
};
export default function EntryDetail(
  props: DetailActions & {
    row: Vault.Summary;
    readonly?: boolean;
    lifecycleHeader?: ReactNode;
    lifecycleActions?: ReactNode;
    deleteImpact: string;
    busy: boolean;
    detail?: Vault.PlainItem;
    revealUntil: number;
    copyFallback?: string;
    onBack: () => void;
  },
) {
  const t = useText();
  const { row } = props;
  const [now, setNow] = useState(Date.now());
  const [notes, setNotes] = useState<string>();
  const [notesError, setNotesError] = useState(false);
  const [notesBusy, setNotesBusy] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [dialog, setDialog] = useState<
    'manage' | 'replace' | 'remove' | 'delete'
  >();
  const noteSerial = useRef(0);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const closeTransfer = () => {
    setTransfer(false);
    requestAnimationFrame(() => {
      if (!document.hidden)
        content.current
          ?.querySelector<HTMLButtonElement>('[data-transfer]')
          ?.focus();
    });
  };
  const hideNotes = () => {
    noteSerial.current++;
    setNotes(undefined);
    setNotesBusy(false);
    clearTimeout(noteTimer.current);
  };
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    const hide = () => {
      if (document.hidden) {
        hideNotes();
        setTransfer(false);
        setDialog(undefined);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideNotes();
        props.onCloseDetail();
      }
    };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('keydown', onEscape);
    return () => {
      noteSerial.current++;
      clearTimeout(noteTimer.current);
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('keydown', onEscape);
    };
  }, []);
  useEffect(() => {
    if (!props.detail) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [props.detail]);
  const seconds = Math.max(0, Math.ceil((props.revealUntil - now) / 1000));
  const detail = seconds > 0 ? props.detail : undefined;
  return (
    <div className={styles.detailContent} ref={content}>
      <Button
        className={styles.back}
        type="link"
        onClick={props.onBack}
        icon={<ArrowLeft size={16} />}
      >
        {t('vault.backList')}
      </Button>
      <div className={styles.detailHead}>
        <span className={styles.detailIcon}>
          {Array.from(row.title)[0]?.toLocaleUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h2 ref={heading} tabIndex={-1}>
            {row.title}
          </h2>
          <p className={styles.help}>
            {t('vault.loginAccount')}
            {row.hasTotp && ` · ${t('entries.factorSaved')}`}
            {props.readonly && ` · ${t('deleted.readonly')}`}
          </p>
        </div>
        {props.readonly ? (
          props.lifecycleActions
        ) : (
          <Button
            disabled={props.busy}
            onClick={() => props.onEdit(row.itemId)}
            icon={<Pencil size={16} />}
          >
            {t('vault.editItem')}
          </Button>
        )}
      </div>
      {props.lifecycleHeader}
      <div className={styles.detailColumns}>
        <div className={styles.primaryColumn}>
          <section
            className={styles.credentials}
            aria-label={t('entries.loginInfo')}
          >
            <div className={styles.valueField}>
              <div className={styles.valueLabel}>{t('vault.username')}</div>
              <div className={styles.valueRow}>
                <span>{row.username || t('vault.notFilled')}</span>
                <Button
                  type="text"
                  aria-label={t('vault.copyUsername')}
                  disabled={!row.username || props.busy}
                  onClick={() => props.onCopyText(row.username)}
                  icon={<Copy size={17} />}
                />
              </div>
            </div>
            <div className={styles.valueField}>
              <div className={styles.valueLabel}>
                {t('vault.password')}
                {detail && (
                  <span role="timer">
                    {t('vault.hideCountdown', { seconds })}
                  </span>
                )}
              </div>
              <div className={styles.valueRow}>
                <span className={styles.password}>
                  {row.hasPassword
                    ? detail?.password || '••••••••••••'
                    : t('vault.notFilled')}
                </span>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="text"
                    aria-label={t(detail ? 'vault.hideNow' : 'vault.reveal')}
                    disabled={!row.hasPassword || props.busy}
                    onClick={() =>
                      detail
                        ? props.onCloseDetail()
                        : props.onReveal(row.itemId)
                    }
                    icon={detail ? <EyeOff size={17} /> : <Eye size={17} />}
                  />
                  <Button
                    disabled={!row.hasPassword || props.busy}
                    onClick={() => props.onCopy(row.itemId)}
                    icon={<Copy size={16} />}
                  >
                    {t('vault.copy')}
                  </Button>
                </div>
              </div>
            </div>
          </section>
          {row.hasTotp ? (
            <TotpView
              itemId={row.itemId}
              info={row.totpInfo}
              disabled={props.busy}
              onCode={props.onCode}
              actions={
                props.readonly ? (
                  <p className={styles.help}>{t('deleted.totpHint')}</p>
                ) : (
                  <>
                    <Button
                      type="link"
                      disabled={props.busy}
                      data-transfer
                      onClick={() => setTransfer(true)}
                      icon={<QrCode size={16} />}
                    >
                      {t('entries.transfer')}
                    </Button>
                    <Button
                      type="link"
                      disabled={props.busy}
                      onClick={() => setDialog('manage')}
                    >
                      {t('entries.manage')}
                    </Button>
                  </>
                )
              }
            />
          ) : !props.readonly ? (
            <section className={styles.totpPanel}>
              <h3>{t('vault.totp')}</h3>
              <p className={styles.help}>{t('entries.factorHint')}</p>
              <Button
                className="mt-3"
                disabled={props.busy}
                icon={<ScanLine size={16} />}
                onClick={() => props.onEdit(row.itemId, 'replace')}
              >
                {t('vault.totpAdd')}
              </Button>
            </section>
          ) : null}
          {props.copyFallback !== undefined && (
            <div className={styles.warning} role="alert">
              <p>{t('vault.copyFailed')}</p>
              <textarea
                readOnly
                className={styles.copyFallback}
                aria-label={t('vault.manualCopy')}
                value={props.copyFallback}
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button onClick={props.onCloseDetail}>
                {t('vault.hideNow')}
              </Button>
            </div>
          )}
        </div>
        <aside
          className={styles.secondaryColumn}
          aria-label={t('entries.otherInfo')}
        >
          <div className={styles.valueField}>
            <div className={styles.valueLabel}>{t('vault.website')}</div>
            <div className={styles.valueRow}>
              <span>{row.website || t('vault.notFilled')}</span>
              <Button
                type="text"
                aria-label={t('vault.copyWebsite')}
                disabled={!row.website || props.busy}
                onClick={() => props.onCopyText(row.website)}
                icon={<Copy size={17} />}
              />
            </div>
          </div>
          <div className={styles.valueField}>
            <div className={styles.valueLabel}>{t('vault.tags')}</div>
            <div className={styles.tags}>
              {row.tags.length
                ? row.tags.map((tag) => <span key={tag}>{tag}</span>)
                : t('vault.notFilled')}
            </div>
          </div>
          <div className={styles.valueField}>
            <div className={styles.valueLabel}>
              {t('vault.notes')}
              <Button
                type="link"
                disabled={props.busy || notesBusy}
                onClick={async () => {
                  if (notes !== undefined) {
                    hideNotes();
                    return;
                  }
                  const current = ++noteSerial.current;
                  setNotesError(false);
                  setNotesBusy(true);
                  try {
                    const value = await props.onNotes(row.itemId);
                    if (current === noteSerial.current && !document.hidden) {
                      setNotes(value);
                      noteTimer.current = setTimeout(hideNotes, 20000);
                    }
                  } catch {
                    if (current === noteSerial.current) setNotesError(true);
                  } finally {
                    if (current === noteSerial.current) setNotesBusy(false);
                  }
                }}
              >
                {t(
                  notes === undefined
                    ? 'entries.showNotes'
                    : 'entries.hideNotes',
                )}
              </Button>
            </div>
            <p className={styles.notes}>
              {notes === undefined
                ? t('vault.notesHidden')
                : notes || t('vault.noNotes')}
            </p>
            {notesError && <p role="alert">{t('vault.requestFailed')}</p>}
          </div>
        </aside>
      </div>
      {!props.readonly && (
        <div className={styles.detailFooter}>
          <p className={styles.help}>{t('vault.localSearch')}</p>
          <Button
            type="link"
            danger
            disabled={props.busy}
            onClick={() => setDialog('delete')}
            icon={<Trash2 size={15} />}
          >
            {t('vault.delete')}
          </Button>
        </div>
      )}
      {!props.readonly && transfer && row.totpInfo && (
        <TotpTransferDialog
          itemId={row.itemId}
          info={{ ...row.totpInfo, ...totpTransferLabels(row.totpInfo, row) }}
          onClose={closeTransfer}
          onExport={props.onExport}
          onCode={props.onCode}
        />
      )}
      {!props.readonly && dialog && (
        <Modal
          open
          title={t(
            dialog === 'manage'
              ? 'entries.manageTitle'
              : dialog === 'replace'
                ? 'entries.replaceTitle'
                : dialog === 'remove'
                  ? 'entries.removeTitle'
                  : 'entries.deleteTitle',
          )}
          className={styles.dialog}
          modalRender={(node) => (
            <div role="presentation" onKeyDownCapture={trapDialogTab}>
              {node}
            </div>
          )}
          closable={{ 'aria-label': t('entries.closeDialog') }}
          getContainer={false}
          destroyOnHidden
          focusable={{ trap: true, focusTriggerAfterClose: true }}
          mask={{ closable: false }}
          onCancel={() => setDialog(undefined)}
          footer={dialog === 'manage' ? null : undefined}
          cancelText={t('vault.cancel')}
          okText={t(
            dialog === 'delete'
              ? 'deleted.move'
              : dialog === 'remove'
                ? 'vault.totpRemove'
                : 'entries.importStep',
          )}
          okButtonProps={{
            danger: dialog === 'remove' || dialog === 'delete',
            disabled: props.busy,
          }}
          onOk={() => {
            if (dialog === 'delete') props.onDelete(row.itemId);
            else
              props.onEdit(
                row.itemId,
                dialog === 'remove' ? 'remove' : 'replace',
              );
            setDialog(undefined);
          }}
        >
          {dialog === 'manage' ? (
            <div className="grid gap-3">
              <p className={styles.help}>
                {row.totpInfo?.issuer} · {row.totpInfo?.accountName}
              </p>
              <Button
                onClick={() => {
                  setDialog(undefined);
                  setTransfer(true);
                }}
                icon={<QrCode size={16} />}
              >
                {t('entries.transfer')}
              </Button>
              <Button onClick={() => setDialog('replace')}>
                {t('vault.totpReplace')}
              </Button>
              <Button danger onClick={() => setDialog('remove')}>
                {t('vault.totpRemove')}
              </Button>
            </div>
          ) : (
            <p>
              {t(
                dialog === 'delete'
                  ? 'entries.deleteWarning'
                  : dialog === 'remove'
                    ? 'entries.removeWarning'
                    : 'entries.replaceWarning',
              )}
            </p>
          )}
          {dialog === 'delete' && <p>{props.deleteImpact}</p>}
        </Modal>
      )}
    </div>
  );
}
