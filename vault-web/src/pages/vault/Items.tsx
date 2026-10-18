import { Button, Input, Select } from 'antd';
import {
  ArrowLeft,
  Check,
  KeyRound,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';
import type { ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import entry from './Entries.module.css';
import EntryDetail, { type DetailActions } from './EntryDetail';
import ItemEditor, { type Editor, type EditorHandle } from './ItemEditor';
import { useText } from './text';
import styles from './Vault.module.css';

type Props = DetailActions & {
  rows: Vault.Summary[];
  allRows: Vault.Summary[];
  selected?: string;
  busy: boolean;
  query: string;
  editor?: Editor;
  editorRef: RefObject<EditorHandle | null>;
  detail?: Vault.PlainItem;
  revealUntil: number;
  copyFallback?: string;
  uncertain: boolean;
  conflict: boolean;
  syncFailed: boolean;
  securityPanel?: ReactNode;
  onDraftCode: (config: Vault.Totp) => Promise<Vault.TotpCode>;
  onSearch: (value: string) => void;
  onNew: () => void;
  onSelect: (id?: string) => void;
  onReload: () => void;
  onSave: (plain: Vault.PlainItem, preserveTotp: boolean) => void;
  onGenerate: (
    length: number,
    symbols: boolean,
    set: (password: string) => void,
  ) => void;
  onCloseEditor: () => void;
};
export default function Items(props: Props) {
  const t = useText();
  const [filter, setFilter] = useState('');
  const [security, setSecurity] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [desktop, setDesktop] = useState(
    () => window.matchMedia('(min-width: 621px)').matches,
  );
  const listButtons = useRef(new Map<string, HTMLButtonElement>());
  const dataset = useRef(props.allRows);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 621px)');
    const resize = () => setDesktop(media.matches);
    media.addEventListener('change', resize);
    return () => media.removeEventListener('change', resize);
  }, []);
  useEffect(() => {
    if (props.editor) setMobileDetail(true);
  }, [props.editor]);
  const tags = Array.from(new Set(props.allRows.flatMap((row) => row.tags)));
  const matches = (row: Vault.Summary) =>
    !filter ||
    (filter === '2fa' ? row.hasTotp : row.tags.includes(filter.slice(4)));
  const rows = props.rows.filter(matches);
  const row = rows.find((item) => item.itemId === props.selected);
  useEffect(() => {
    if (props.busy) return;
    const changed = dataset.current !== props.allRows;
    dataset.current = props.allRows;
    if (
      changed &&
      filter &&
      props.allRows.some(
        (item) => item.itemId === props.selected && !matches(item),
      )
    ) {
      setFilter('');
      return;
    }
    if (!props.editor && !rows.some((item) => item.itemId === props.selected))
      props.onSelect(rows[0]?.itemId);
  }, [props.rows, props.allRows, filter, props.editor, props.busy]);
  const navigate = (action: () => void) => {
    if (props.editor)
      props.editorRef.current?.leave(() => {
        props.onCloseEditor();
        action();
      });
    else action();
  };
  const changeFilter = (value: string) =>
    navigate(() => {
      props.onCloseDetail();
      setFilter(value);
      setSecurity(false);
      setMobileDetail(false);
    });
  const back = () => {
    props.onCloseDetail();
    setMobileDetail(false);
    if (props.selected) listButtons.current.get(props.selected)?.focus();
  };
  const add = () =>
    navigate(() => {
      setSecurity(false);
      props.onCloseDetail();
      setMobileDetail(true);
      props.onNew();
    });
  const filterLabel =
    filter === '2fa'
      ? t('entries.with2fa')
      : filter
        ? filter.slice(4)
        : t('vault.allPasswords');
  return (
    <div className={`${styles.workspace} ${entry.workspace}`} data-entries>
      <aside className={styles.sidebar} aria-label={t('vault.navigation')}>
        <button
          type="button"
          className={`${styles.nav} ${!filter && !security ? styles.selected : ''}`}
          aria-current={!filter && !security ? 'page' : undefined}
          onClick={() => changeFilter('')}
        >
          <KeyRound size={17} />
          <span>{t('vault.allPasswords')}</span>
          <small>{props.allRows.length}</small>
        </button>
        <button
          type="button"
          className={`${styles.nav} ${filter === '2fa' && !security ? styles.selected : ''}`}
          aria-current={filter === '2fa' && !security ? 'page' : undefined}
          onClick={() => changeFilter('2fa')}
        >
          <ScanLine size={17} />
          <span>{t('entries.with2fa')}</span>
          <small>{props.allRows.filter((item) => item.hasTotp).length}</small>
        </button>
        <div className={styles.navLabel}>{t('vault.tags')}</div>
        {tags.map((tag) => (
          <button
            type="button"
            key={tag}
            title={tag}
            className={`${styles.nav} ${styles.tagNav} ${filter === `tag:${tag}` ? styles.selected : ''}`}
            onClick={() => changeFilter(`tag:${tag}`)}
          >
            <Tag size={16} />
            <span>{tag}</span>
            <small>
              {props.allRows.filter((item) => item.tags.includes(tag)).length}
            </small>
          </button>
        ))}
        <button
          type="button"
          className={`${styles.nav} ${security ? styles.selected : ''} mt-6`}
          onClick={() =>
            navigate(() => {
              props.onCloseDetail();
              setSecurity(true);
            })
          }
        >
          <SlidersHorizontal size={17} />
          <span>{t('vault.security')}</span>
        </button>
        <div className={styles.account}>
          <span className={styles.avatar}>
            <ShieldCheck size={17} />
          </span>
          <span>
            MINI ERP
            <br />
            {t('vault.personalSpace')}
          </span>
        </div>
      </aside>
      <section className={entry.main}>
        <div className={entry.mobileFilter}>
          <Select
            className="w-full"
            aria-label={t('entries.groupSelector')}
            value={security ? 'security' : filter}
            options={[
              { value: '', label: t('vault.allPasswords') },
              { value: '2fa', label: t('entries.with2fa') },
              ...tags.map((tag) => ({ value: `tag:${tag}`, label: tag })),
              { value: 'security', label: t('vault.security') },
            ]}
            onChange={(value) =>
              value === 'security'
                ? navigate(() => {
                    props.onCloseDetail();
                    setSecurity(true);
                  })
                : changeFilter(value)
            }
          />
        </div>
        {security ? (
          <div className={styles.security}>
            <h1>{t('vault.security')}</h1>
            {props.securityPanel}
            <div className={styles.securityRow}>
              <h2>{t('vault.autoLock')}</h2>
              <p>{t('vault.lockHint', VAULT_AUTO_LOCK)}</p>
              <p>{t('vault.revealHint')}</p>
            </div>
            <Button
              className="mt-6"
              onClick={() => changeFilter('')}
              icon={<ArrowLeft size={16} />}
            >
              {t('vault.backList')}
            </Button>
          </div>
        ) : (
          <div
            className={`${entry.split} ${mobileDetail ? entry.mobileDetail : ''}`}
          >
            <section className={entry.list} aria-label={t('vault.items')}>
              <div className={entry.listHead}>
                <h1>{filterLabel}</h1>
                <Button
                  type="primary"
                  aria-label={t('vault.newItem')}
                  disabled={props.busy}
                  onClick={add}
                  icon={<Plus size={18} />}
                />
              </div>
              <div className={entry.search}>
                <Input
                  value={props.query}
                  maxLength={1024}
                  disabled={!!props.editor}
                  prefix={<Search size={17} />}
                  placeholder={t('vault.search')}
                  aria-label={t('vault.search')}
                  allowClear
                  onChange={(event) => props.onSearch(event.target.value)}
                />
              </div>
              <div className={styles.listCaption}>
                <span>{t('vault.entryCount', { count: rows.length })}</span>
                <span>{t('vault.localSearch')}</span>
              </div>
              <div className={entry.entries}>
                {rows.map((item) => (
                  <button
                    ref={(node) => {
                      if (node) listButtons.current.set(item.itemId, node);
                      else listButtons.current.delete(item.itemId);
                    }}
                    type="button"
                    key={item.itemId}
                    className={`${styles.item} ${item.itemId === props.selected && !props.editor ? styles.selected : ''}`}
                    aria-current={
                      item.itemId === props.selected ? 'true' : undefined
                    }
                    onClick={() =>
                      navigate(() => {
                        props.onSelect(item.itemId);
                        setMobileDetail(true);
                      })
                    }
                  >
                    <span className={styles.itemIcon}>
                      {Array.from(item.title)[0]?.toLocaleUpperCase()}
                    </span>
                    <span className={styles.itemText}>
                      <b>{item.title}</b>
                      <small>
                        {item.username || item.website || t('vault.noAccount')}
                      </small>
                    </span>
                    {item.hasTotp && (
                      <ScanLine
                        size={16}
                        role="img"
                        aria-label={t('entries.has2fa')}
                      />
                    )}
                  </button>
                ))}
                {!rows.length && (
                  <div className={styles.empty} role="status">
                    <p>
                      {t(
                        props.syncFailed
                          ? 'vault.syncFailed'
                          : props.query || filter
                            ? 'vault.noResults'
                            : 'vault.empty',
                      )}
                    </p>
                    {!props.query && !filter && !props.syncFailed && (
                      <Button
                        type="primary"
                        disabled={props.busy}
                        onClick={add}
                      >
                        {t('vault.firstItem')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <p className={entry.sync} role="status">
                {props.syncFailed || props.uncertain || props.conflict ? (
                  <RefreshCw size={14} />
                ) : (
                  <Check size={14} />
                )}
                {t(
                  props.busy
                    ? 'vault.syncing'
                    : props.syncFailed
                      ? 'vault.syncFailed'
                      : props.uncertain || props.conflict
                        ? 'vault.notSaved'
                        : 'vault.synced',
                )}
              </p>
            </section>
            <section
              className={entry.detail}
              aria-label={t(
                props.editor ? 'vault.editorPanel' : 'vault.detailPanel',
              )}
            >
              {props.editor ? (
                <ItemEditor
                  ref={props.editorRef}
                  editor={props.editor}
                  busy={props.busy}
                  uncertain={props.uncertain}
                  conflict={props.conflict}
                  onClose={() => {
                    props.onCloseEditor();
                    setMobileDetail(false);
                  }}
                  onReload={props.onReload}
                  onSave={props.onSave}
                  onDelete={props.onDelete}
                  onDraftCode={props.onDraftCode}
                  onGenerate={props.onGenerate}
                />
              ) : row && (desktop || mobileDetail) ? (
                <EntryDetail
                  key={row.itemId}
                  row={row}
                  busy={props.busy}
                  detail={props.detail}
                  revealUntil={props.revealUntil}
                  copyFallback={props.copyFallback}
                  onBack={back}
                  onCode={props.onCode}
                  onNotes={props.onNotes}
                  onExport={props.onExport}
                  onReveal={props.onReveal}
                  onCopy={props.onCopy}
                  onCopyText={props.onCopyText}
                  onEdit={props.onEdit}
                  onDelete={props.onDelete}
                  onCloseDetail={props.onCloseDetail}
                />
              ) : (
                <div className={styles.empty}>{t('entries.selectItem')}</div>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
export type { Editor } from './ItemEditor';
