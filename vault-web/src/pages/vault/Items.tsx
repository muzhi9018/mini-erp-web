import { Button, Input, Select } from 'antd';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  KeyRound,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Trash2,
} from 'lucide-react';
import type { ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { VaultClient } from '@/security/vault/client';
import DeletedView from './DeletedView';
import entry from './Entries.module.css';
import EntryDetail, { type DetailActions } from './EntryDetail';
import GroupDetail from './GroupDetail';
import GroupEditor from './GroupEditor';
import { type GroupEditorDraft, groupDraft, groupPlain } from './groups';
import ItemEditor, { type Editor, type EditorHandle } from './ItemEditor';
import { useText } from './text';
import styles from './Vault.module.css';

type Props = DetailActions & {
  deletedRows: Vault.DeletedSummary[];
  deletedServerNow: () => number;
  client: VaultClient;
  guard: <T>(promise: Promise<T>) => Promise<T>;
  onDeletedBlocked: (value: boolean) => void;
  onOperationActivity: (value: boolean) => void;
  onDeletedSync: () => Promise<unknown>;
  onForgetDeleted: (id: string) => void;
  groups: Vault.GroupSummary[];
  groupEditor?: GroupEditorDraft;
  onGroupEditor: (draft: GroupEditorDraft) => void;
  onSaveChanges: (changes: Vault.RecordChange[], prefer?: string) => void;
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
  onNew: (groupId?: string) => void;
  onSelect: (id?: string) => void;
  onReload: () => void;
  onSave: (plain: Vault.PlainItem, preserveTotp: boolean) => void;
  onGenerate: (length: number, symbols: boolean) => Promise<string>;
  onCloseEditor: () => void;
};
export default function Items(props: Props) {
  const t = useText();
  const [filter, setFilter] = useState('');
  const [deletedBlocked, setDeletedBlocked] = useState(false);
  const [contextGroup, setContextGroup] = useState<string>();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const editing = props.editor || props.groupEditor;
  const blocked = props.busy || props.uncertain;
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
    if (editing) setMobileDetail(true);
  }, [editing]);
  const tags = Array.from(new Set(props.allRows.flatMap((row) => row.tags)));
  const matches = (row: Vault.Summary) =>
    !filter ||
    filter === 'groups' ||
    (filter === '2fa' ? row.hasTotp : row.tags.includes(filter.slice(4)));
  const rows = props.rows.filter(matches);
  const row = props.allRows.find((item) => item.itemId === props.selected);
  const visibleGroups = props.groups.filter(
    (group) =>
      !props.query ||
      group.name
        .toLocaleLowerCase()
        .includes(props.query.toLocaleLowerCase()) ||
      group.memberItemIds.some((id) =>
        props.rows.some((item) => item.itemId === id),
      ),
  );
  const group = props.groups.find((item) => item.itemId === props.selected);
  const groupView = filter === 'groups';
  const validIds = groupView
    ? visibleGroups.flatMap((group) => [group.itemId, ...group.memberItemIds])
    : rows.map((row) => row.itemId);
  useEffect(() => {
    if (props.busy || filter === 'deleted') return;
    const changed = dataset.current !== props.allRows;
    dataset.current = props.allRows;
    if (
      changed &&
      filter &&
      filter !== 'groups' &&
      filter !== 'deleted' &&
      props.allRows.some(
        (item) => item.itemId === props.selected && !matches(item),
      )
    ) {
      setFilter('');
      return;
    }
    if (!editing && !validIds.includes(props.selected || ''))
      props.onSelect(validIds[0]);
  }, [props.rows, props.allRows, props.groups, filter, editing, props.busy]);
  const navigate = (action: () => void) => {
    if (props.busy || deletedBlocked || (props.uncertain && !editing)) return;
    if (editing)
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
      if (groupView) props.onGroupEditor(groupDraft());
      else props.onNew();
    });
  const filterLabel =
    filter === 'groups'
      ? t('groups.title')
      : filter === '2fa'
        ? t('entries.with2fa')
        : filter
          ? filter.slice(4)
          : t('vault.allPasswords');
  const renderItem = (item: Vault.Summary, groupId?: string) => (
    <button
      ref={(node) => {
        if (node) listButtons.current.set(item.itemId, node);
        else listButtons.current.delete(item.itemId);
      }}
      type="button"
      key={`${groupId || 'all'}:${item.itemId}`}
      title={[item.title, item.platform, item.username, item.website]
        .filter(Boolean)
        .join('\n')}
      className={`${styles.item} ${item.itemId === props.selected && !editing ? styles.selected : ''}`}
      aria-current={item.itemId === props.selected ? 'true' : undefined}
      onClick={() =>
        navigate(() => {
          setContextGroup(groupId);
          props.onSelect(item.itemId);
          setMobileDetail(true);
        })
      }
    >
      <span className={styles.itemIcon}>
        {item.platform?.slice(0, 2) ||
          Array.from(item.title)[0]?.toLocaleUpperCase()}
      </span>
      <span className={styles.itemText}>
        <b>{item.title}</b>
        <small>
          {[
            item.platform,
            item.username || item.website || t('vault.noAccount'),
          ]
            .filter(Boolean)
            .join(' · ')}
        </small>
      </span>
      {item.hasTotp && (
        <ScanLine size={16} role="img" aria-label={t('entries.has2fa')} />
      )}
    </button>
  );
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
          className={`${styles.nav} ${groupView && !security ? styles.selected : ''}`}
          aria-current={groupView && !security ? 'page' : undefined}
          onClick={() => changeFilter('groups')}
        >
          <FolderOpen size={17} />
          <span>{t('groups.title')}</span>
          <small>{props.groups.length}</small>
        </button>
        <button
          type="button"
          className={`${styles.nav} ${filter === 'deleted' && !security ? styles.selected : ''}`}
          aria-current={filter === 'deleted' && !security ? 'page' : undefined}
          onClick={() => changeFilter('deleted')}
        >
          <Trash2 size={17} />
          <span>{t('deleted.title')}</span>
          <small>{props.deletedRows.length}</small>
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
              { value: 'groups', label: t('groups.title') },
              { value: 'deleted', label: t('deleted.title') },
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
        ) : filter === 'deleted' ? (
          <DeletedView
            onOperationActivity={props.onOperationActivity}
            serverNow={props.deletedServerNow}
            rows={props.deletedRows}
            client={props.client}
            guard={props.guard}
            onSync={props.onDeletedSync}
            onForget={props.onForgetDeleted}
            onBlocked={(value) => {
              setDeletedBlocked(value);
              props.onDeletedBlocked(value);
            }}
            onNormal={(id) => {
              setFilter('');
              props.onSearch('');
              props.onSelect(id);
              setMobileDetail(!!id);
            }}
          />
        ) : (
          <div
            className={`${entry.split} ${mobileDetail ? entry.mobileDetail : ''}`}
          >
            <section className={entry.list} aria-label={t('vault.items')}>
              <div className={entry.listHead}>
                <h1>{filterLabel}</h1>
                <Button
                  type="primary"
                  aria-label={t(groupView ? 'groups.new' : 'vault.newItem')}
                  disabled={blocked}
                  onClick={add}
                  icon={<Plus size={18} />}
                />
              </div>
              <div className={entry.search}>
                <Input
                  value={props.query}
                  maxLength={1024}
                  disabled={!!editing}
                  prefix={<Search size={17} />}
                  placeholder={t(groupView ? 'groups.search' : 'vault.search')}
                  aria-label={t(groupView ? 'groups.search' : 'vault.search')}
                  allowClear
                  onChange={(event) => props.onSearch(event.target.value)}
                />
              </div>
              <div className={styles.listCaption}>
                <span>
                  {t(groupView ? 'groups.groupCount' : 'vault.entryCount', {
                    count: groupView ? visibleGroups.length : rows.length,
                  })}
                </span>
                <span>{t('vault.localSearch')}</span>
              </div>
              <div className={entry.entries}>
                {groupView
                  ? visibleGroups.map((item) => (
                      <div key={item.itemId} className={entry.treeGroup}>
                        <div className={entry.treeHead}>
                          <button
                            type="button"
                            aria-label={t('groups.toggle', { name: item.name })}
                            aria-expanded={
                              !!props.query ||
                              expanded.has(item.itemId) ||
                              contextGroup === item.itemId
                            }
                            onClick={() => {
                              setContextGroup(undefined);
                              setExpanded((value) => {
                                const next = new Set(value);
                                if (next.has(item.itemId))
                                  next.delete(item.itemId);
                                else next.add(item.itemId);
                                return next;
                              });
                            }}
                          >
                            {props.query ||
                            expanded.has(item.itemId) ||
                            contextGroup === item.itemId ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </button>
                          <button
                            type="button"
                            className={`${entry.groupName} ${props.selected === item.itemId ? styles.selected : ''}`}
                            aria-current={
                              props.selected === item.itemId
                                ? 'true'
                                : undefined
                            }
                            onClick={() =>
                              navigate(() => {
                                setContextGroup(item.itemId);
                                setExpanded(
                                  (value) => new Set([...value, item.itemId]),
                                );
                                props.onSelect(item.itemId);
                                setMobileDetail(true);
                              })
                            }
                          >
                            <FolderOpen size={17} />
                            <span>
                              <b>{item.name}</b>
                            </span>
                            <small>{item.memberItemIds.length}</small>
                          </button>
                        </div>
                        {(props.query ||
                          expanded.has(item.itemId) ||
                          contextGroup === item.itemId) && (
                          <div className={entry.treeMembers}>
                            {item.memberItemIds.map((id) => {
                              const row = props.allRows.find(
                                (value) => value.itemId === id,
                              );
                              return row ? (
                                renderItem(row, item.itemId)
                              ) : (
                                <p key={id} className={entry.help}>
                                  {t('groups.unavailable')}
                                </p>
                              );
                            })}
                            {!item.memberItemIds.length && (
                              <p className={entry.help}>
                                {t('groups.emptyMembers')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  : rows.map((item) => renderItem(item))}
                {!(groupView ? visibleGroups.length : rows.length) && (
                  <div className={styles.empty} role="status">
                    <p>
                      {t(
                        props.syncFailed
                          ? 'vault.syncFailed'
                          : !props.query && groupView
                            ? 'groups.empty'
                            : props.query || filter
                              ? 'vault.noResults'
                              : 'vault.empty',
                      )}
                    </p>
                    {!props.query &&
                      (!filter || groupView) &&
                      !props.syncFailed && (
                        <Button type="primary" disabled={blocked} onClick={add}>
                          {t(groupView ? 'groups.new' : 'vault.firstItem')}
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
                editing ? 'vault.editorPanel' : 'vault.detailPanel',
              )}
            >
              {props.groupEditor ? (
                <GroupEditor
                  key={props.groupEditor.itemId}
                  ref={props.editorRef}
                  draft={props.groupEditor}
                  allRows={props.allRows}
                  busy={props.busy}
                  uncertain={props.uncertain}
                  conflict={props.conflict}
                  onClose={props.onCloseEditor}
                  onReload={props.onReload}
                  onSave={props.onSaveChanges}
                />
              ) : props.editor ? (
                <ItemEditor
                  ref={props.editorRef}
                  editor={props.editor}
                  groupName={
                    props.groups.find(
                      (group) => group.itemId === props.editor?.groupId,
                    )?.name
                  }
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
              ) : group && (desktop || mobileDetail) ? (
                <GroupDetail
                  key={group.itemId}
                  group={group}
                  allRows={props.allRows}
                  busy={blocked}
                  onBack={back}
                  onSelect={(id) => {
                    props.onSelect(id);
                    setContextGroup(group.itemId);
                  }}
                  onEdit={() =>
                    props.onGroupEditor({
                      itemId: group.itemId,
                      group: groupPlain(group),
                      isNew: false,
                    })
                  }
                  onNew={() => {
                    props.onCloseDetail();
                    props.onNew(group.itemId);
                    setMobileDetail(true);
                  }}
                  onDelete={props.onDelete}
                  onSave={props.onSaveChanges}
                />
              ) : row && (desktop || mobileDetail) ? (
                <EntryDetail
                  key={row.itemId}
                  row={row}
                  busy={blocked}
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
