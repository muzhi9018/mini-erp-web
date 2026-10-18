import { Button, Input } from 'antd';
import { useRef, useState } from 'react';
import { assert, exact, object, uuid } from '@/security/vault/protocol';
import * as rotation from '@/services/vault/rotation';
import { useText } from '../text';
import s from './Management.module.css';
import { FileField, FlowFooter, Note, Stage, useManagement } from './shared';
import Transition, { saveTask, TaskFacts } from './Transition';

export default function Tasks({ initialId }: { initialId: string }) {
  const t = useText();
  const {
    execute,
    guard,
    authorize,
    busy,
    finish,
    ownerSubject,
    client,
    setDirty,
  } = useManagement();
  const [id, setId] = useState(initialId);
  const [task, setTask] = useState<Vault.Rotation>();
  const [unknown, setUnknown] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const cancelKey = useRef(crypto.randomUUID());
  const resumeKey = useRef(crypto.randomUUID());
  const query = async () => {
    uuid(id);
    setUnknown(true);
    const current = await guard(rotation.status(id));
    setTask(current);
    setUnknown(false);
    setCancelConfirm(false);
    return current;
  };
  if (resuming && task)
    return (
      <>
        <Note>{t('manage.originalOnly')}</Note>
        <Transition
          key={task.rotationId}
          restore={task.mode === 'RESTORE'}
          existingTask={task}
        />
      </>
    );
  return (
    <>
      {task && (
        <div className={s.panel}>
          <TaskFacts task={task} />
          <Note>{t('manage.taskFilePublic')}</Note>
          <div className={s.actions}>
            <Button onClick={() => saveTask(task.rotationId)}>
              {t('vault.saveTask')}
            </Button>
            <Button disabled={busy} onClick={() => execute(query)}>
              {t('vault.queryTask')}
            </Button>
          </div>
          {task.status === 'COMMITTED' ? (
            <>
              <Note>{t('vault.committedHint')}</Note>
              <Button
                type="primary"
                onClick={() =>
                  finish({
                    ownerSubject,
                    rotationId: task.rotationId,
                    mode: task.mode,
                    generation: task.generation,
                    keyEpoch: task.keyEpoch,
                    count: task.expectedItemCount,
                  })
                }
              >
                {t('manage.reloginVerify')}
              </Button>
            </>
          ) : task.status === 'UPLOADING' ? (
            <>
              <Note warning>{t('manage.takeoverRules')}</Note>
              <div className={s.actions}>
                <Button
                  type="primary"
                  disabled={
                    busy || unknown || Date.now() >= Date.parse(task.expiresAt)
                  }
                  onClick={() =>
                    authorize(t('manage.takeover'), async () => {
                      const current = await query();
                      if (current.status !== 'UPLOADING') return;
                      assert(Date.now() < Date.parse(current.expiresAt));
                      await guard(
                        rotation.resume({
                          rotationId: current.rotationId,
                          expectedCollectionRevision:
                            current.expectedCollectionRevision,
                          idempotencyKey: resumeKey.current,
                        }),
                      );
                      setTask(await guard(rotation.status(current.rotationId)));
                      client.reset();
                      setDirty(true);
                      setResuming(true);
                    })
                  }
                >
                  {t('manage.takeover')}
                </Button>
                <Button
                  danger
                  disabled={busy || unknown}
                  onClick={() => setCancelConfirm(true)}
                >
                  {t('vault.cancelTask')}
                </Button>
              </div>
              {cancelConfirm && (
                <Note warning>
                  <p>{t('vault.cancelTaskHint')}</p>
                  <div className={s.actions}>
                    <Button
                      danger
                      disabled={busy}
                      onClick={() =>
                        authorize(t('vault.cancelTask'), async () => {
                          const current = await query();
                          if (current.status !== 'UPLOADING') return;
                          setUnknown(true);
                          await guard(
                            rotation.cancel({
                              rotationId: current.rotationId,
                              idempotencyKey: cancelKey.current,
                            }),
                          );
                          await query();
                        })
                      }
                    >
                      {t('manage.confirmCancel')}
                    </Button>
                    <Button onClick={() => setCancelConfirm(false)}>
                      {t('vault.cancel')}
                    </Button>
                  </div>
                </Note>
              )}
            </>
          ) : (
            <Note warning>{t('manage.terminalHint')}</Note>
          )}
        </div>
      )}
      {unknown && <Note warning>{t('manage.uncertain')}</Note>}
      <Stage title={t('manage.findTask')}>{t('manage.findTaskHint')}</Stage>
      <div className={s.formWidth}>
        <FileField
          label={t('vault.taskFile')}
          hint={t('manage.taskFilePublic')}
          validate={(text) => {
            const value = object(JSON.parse(text));
            exact(value, ['formatVersion', 'rotationId']);
            assert(value.formatVersion === 1);
            uuid(value.rotationId);
          }}
          onChange={(text) => {
            setTask(undefined);
            setUnknown(false);
            if (text) setId(object(JSON.parse(text)).rotationId as string);
            else setId('');
          }}
        />
        <label className={s.field} htmlFor="management-task-id">
          {t('vault.taskId')}
          <Input
            id="management-task-id"
            value={id}
            disabled={busy}
            onChange={(event) => {
              setId(event.target.value);
              setTask(undefined);
              setUnknown(false);
            }}
          />
        </label>
      </div>
      <FlowFooter>
        <Button
          type="primary"
          disabled={busy || !id}
          onClick={() => execute(query)}
        >
          {t('vault.queryTask')}
        </Button>
      </FlowFooter>
    </>
  );
}
