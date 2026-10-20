import { Button, Modal } from 'antd';
import { ArrowLeft, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { trapDialogTab } from './dialog';
import styles from './Entries.module.css';
import { groupPlain } from './groups';
import { useText } from './text';

export default function GroupDetail(props: {
  group: Vault.GroupSummary;
  allRows: Vault.Summary[];
  busy: boolean;
  onBack: () => void;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSave: (changes: Vault.RecordChange[], prefer?: string) => void;
}) {
  const t = useText();
  const [confirm, setConfirm] = useState<string>();
  return (
    <div className={styles.detailContent}>
      <Button
        type="link"
        className={styles.back}
        icon={<ArrowLeft size={16} />}
        onClick={props.onBack}
      >
        {t('vault.backList')}
      </Button>
      <div className={styles.detailHead}>
        <span className={styles.detailIcon}>
          <FolderOpen size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <h2>{props.group.name}</h2>
          <p className={styles.help}>
            {t('groups.memberCount', {
              count: props.group.memberItemIds.length,
            })}
          </p>
        </div>
        <Button
          icon={<Pencil size={16} />}
          disabled={props.busy}
          onClick={props.onEdit}
        >
          {t('groups.edit')}
        </Button>
      </div>
      <p className={`${styles.help} mt-3`}>{t('groups.independent')}</p>
      <section className={styles.formSection}>
        <div className={styles.generatorHead}>
          <h3>{t('groups.members')}</h3>
          <Button
            type="link"
            disabled={props.busy}
            icon={<Plus size={16} />}
            onClick={props.onEdit}
          >
            {t('groups.existingMembers')}
          </Button>
        </div>
        <Button
          disabled={props.busy}
          icon={<Plus size={16} />}
          onClick={props.onNew}
        >
          {t('vault.newItem')}
        </Button>
        {props.group.memberItemIds.map((id) => {
          const row = props.allRows.find((item) => item.itemId === id);
          return (
            <div key={id} className={styles.relatedRow}>
              <button
                type="button"
                disabled={!row || props.busy}
                className={styles.relatedLink}
                onClick={() => props.onSelect(id)}
              >
                <span className={styles.relatedIcon}>
                  {row?.platform?.slice(0, 2) || row?.title.slice(0, 1) || '?'}
                </span>
                <span>
                  <b>{row?.title || t('groups.unavailable')}</b>
                  <small>
                    {row
                      ? [row.platform, row.username].filter(Boolean).join(' · ')
                      : t('groups.unavailableHint')}
                  </small>
                </span>
              </button>
              <Button
                type="text"
                disabled={props.busy}
                onClick={() => setConfirm(id)}
              >
                {t('groups.remove')}
              </Button>
            </div>
          );
        })}
        {!props.group.memberItemIds.length && (
          <p className={styles.help}>{t('groups.emptyMembers')}</p>
        )}
      </section>
      <div className={styles.detailFooter}>
        <p className={styles.help}>{t('vault.localSearch')}</p>
        <Button
          danger
          type="link"
          disabled={props.busy}
          icon={<Trash2 size={15} />}
          onClick={() => setConfirm('dissolve')}
        >
          {t('groups.dissolve')}
        </Button>
      </div>
      {confirm && (
        <Modal
          open
          title={t(
            confirm === 'dissolve'
              ? 'groups.dissolveTitle'
              : 'groups.removeTitle',
          )}
          className={styles.dialog}
          getContainer={false}
          mask={{ closable: false }}
          focusable={{ trap: true, focusTriggerAfterClose: true }}
          modalRender={(node) => (
            <div role="presentation" onKeyDownCapture={trapDialogTab}>
              {node}
            </div>
          )}
          cancelText={t('vault.cancel')}
          okText={t(
            confirm === 'dissolve' ? 'groups.dissolve' : 'groups.remove',
          )}
          okButtonProps={{ danger: true, disabled: props.busy }}
          onCancel={() => setConfirm(undefined)}
          onOk={() => {
            if (confirm === 'dissolve') props.onDelete(props.group.itemId);
            else
              props.onSave(
                [
                  {
                    itemId: props.group.itemId,
                    plain: {
                      ...groupPlain(props.group),
                      memberItemIds: props.group.memberItemIds.filter(
                        (id) => id !== confirm,
                      ),
                    },
                  },
                ],
                props.group.itemId,
              );
            setConfirm(undefined);
          }}
        >
          <p>{t('groups.keepPasswords')}</p>
        </Modal>
      )}
    </div>
  );
}
