import { Button, Input, Modal, Select } from 'antd';
import { ArrowLeft, Check, X } from 'lucide-react';
import type { Ref } from 'react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { encoder, parsePlain } from '@/security/vault/protocol';
import { trapDialogTab } from './dialog';
import styles from './Entries.module.css';
import type { GroupEditorDraft } from './groups';
import type { EditorHandle } from './ItemEditor';
import { useText } from './text';

export default function GroupEditor(props: {
  ref?: Ref<EditorHandle>;
  draft: GroupEditorDraft;
  allRows: Vault.Summary[];
  busy: boolean;
  uncertain: boolean;
  conflict: boolean;
  onClose: () => void;
  onReload: () => void;
  onSave: (changes: Vault.RecordChange[], prefer?: string) => void;
}) {
  const t = useText();
  const [name, setName] = useState(props.draft.group.name);
  const [members, setMembers] = useState(props.draft.group.memberItemIds);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [error, setError] = useState('');
  const next = useRef<(() => void) | undefined>(undefined);
  const disabled = props.busy || props.uncertain;
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty || props.uncertain) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', unload);
    return () => window.removeEventListener('beforeunload', unload);
  }, [dirty, props.uncertain]);
  const leave = (action: () => void) => {
    if (props.busy) return;
    if (dirty || props.uncertain) {
      next.current = action;
      setDiscard(true);
    } else action();
  };
  useImperativeHandle(props.ref, () => ({ leave }));
  const save = () => {
    if (props.uncertain) {
      props.onSave([], props.draft.itemId);
      return;
    }
    if (!name.trim()) {
      setError(t('groups.nameRequired'));
      document.getElementById('group-name')?.focus();
      return;
    }
    const group: Vault.PlainGroup = {
      itemSchemaVersion: 3,
      itemType: 'ACCOUNT_GROUP',
      name: name.trim(),
      memberItemIds: members,
    };
    if (encoder.encode(JSON.stringify(group)).length > 16384) {
      setError(t('groups.groupTooLarge'));
      return;
    }
    try {
      parsePlain(group);
      setError('');
      props.onSave(
        [{ itemId: props.draft.itemId, plain: group }],
        props.draft.itemId,
      );
    } catch {
      setError(t('groups.invalidFormat'));
    }
  };
  return (
    <>
      <div className={styles.editorContent}>
        <Button
          type="link"
          className={styles.back}
          icon={<ArrowLeft size={16} />}
          onClick={() => leave(props.onClose)}
        >
          {t('vault.backList')}
        </Button>
        <div className={styles.editorHead}>
          <div>
            <p className={styles.help}>{t('groups.independent')}</p>
            <h2>{t(props.draft.isNew ? 'groups.new' : 'groups.edit')}</h2>
          </div>
          <Button
            type="text"
            icon={<X size={18} />}
            aria-label={t('vault.closeEditor')}
            disabled={props.busy}
            onClick={() => leave(props.onClose)}
          />
        </div>
        <form
          id="vault-group-editor"
          onSubmit={(event) => {
            event.preventDefault();
            if (!props.busy && !props.conflict) save();
          }}
        >
          <section className={styles.formSection}>
            <label className={styles.field} htmlFor="group-name">
              {t('groups.name')}
              <Input
                id="group-name"
                autoFocus
                value={name}
                disabled={disabled}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? 'group-validation-error' : undefined}
                onChange={(event) => {
                  setName(event.target.value);
                  setDirty(true);
                  setError('');
                }}
              />
            </label>
          </section>
          {!props.draft.isNew && (
            <section className={styles.formSection}>
              <label className={styles.field} htmlFor="group-members">
                {t('groups.existingMembers')}
                <Select
                  id="group-members"
                  mode="multiple"
                  showSearch={{ optionFilterProp: 'label' }}
                  value={members}
                  disabled={disabled}
                  options={[
                    ...props.allRows.map((row) => ({
                      value: row.itemId,
                      label: [row.title, row.username]
                        .filter(Boolean)
                        .join(' · '),
                    })),
                    ...members
                      .filter(
                        (id) => !props.allRows.some((row) => row.itemId === id),
                      )
                      .map((id) => ({
                        value: id,
                        label: t('groups.unavailable'),
                      })),
                  ]}
                  onChange={(ids: string[]) => {
                    setMembers(ids);
                    setDirty(true);
                    setError('');
                  }}
                />
              </label>
              <p className={styles.help}>{t('groups.referenceHint')}</p>
            </section>
          )}
        </form>
        {props.draft.isNew && (
          <p className={styles.help}>{t('groups.createHint')}</p>
        )}
        {props.uncertain && (
          <p className={styles.warning} role="status">
            {t('vault.uncertainWrite')}
          </p>
        )}
        {props.conflict && (
          <div className={styles.warning} role="alert">
            <p>{t('groups.conflict')}</p>
            <Button onClick={() => leave(props.onReload)} disabled={props.busy}>
              {t('vault.refresh')}
            </Button>
          </div>
        )}
        {error && (
          <p id="group-validation-error" className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.editorFooter}>
          <Button disabled={props.busy} onClick={() => leave(props.onClose)}>
            {t('vault.cancel')}
          </Button>
          <Button
            type="primary"
            icon={<Check size={16} />}
            loading={props.busy}
            disabled={props.conflict || props.busy}
            htmlType="submit"
            form="vault-group-editor"
          >
            {t(props.uncertain ? 'vault.retrySave' : 'groups.save')}
          </Button>
        </div>
      </div>
      {discard && (
        <Modal
          open
          title={t('entries.discardTitle')}
          getContainer={false}
          className={styles.dialog}
          modalRender={(node) => (
            <div role="presentation" onKeyDownCapture={trapDialogTab}>
              {node}
            </div>
          )}
          mask={{ closable: false }}
          focusable={{ trap: true, focusTriggerAfterClose: true }}
          onCancel={() => setDiscard(false)}
          cancelText={t('vault.keepEditing')}
          okText={t('vault.discard')}
          okButtonProps={{ danger: true }}
          onOk={() => {
            setDiscard(false);
            next.current?.();
          }}
        >
          <p>{t('vault.discardConfirm')}</p>
        </Modal>
      )}
    </>
  );
}
