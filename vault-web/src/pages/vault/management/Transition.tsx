import { Button } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { parseBackup } from '@/security/vault/backup';
import {
  assert,
  parseAccountFile,
  parseRecoveryFile,
} from '@/security/vault/protocol';
import { VaultHttpError } from '@/services/httpClient';
import * as itemAPI from '@/services/vault/item';
import * as rotation from '@/services/vault/rotation';
import * as vault from '@/services/vault/vault';
import { downloadFile } from '../files';
import PasswordInput from '../PasswordInput';
import { useText } from '../text';
import { rememberCompletion } from './completion';
import s from './Management.module.css';
import {
  emptyMaterial,
  FileField,
  FlowFooter,
  MaterialForm,
  materialReady,
  NewFiles,
  NewPassword,
  Note,
  Result,
  Stage,
  Steps,
  Summary,
  useManagement,
} from './shared';

export function saveTask(rotationId: string, filename: string) {
  downloadFile(filename, JSON.stringify({ formatVersion: 1, rotationId }));
}
export function TaskFacts({
  task,
  progress,
}: {
  task: Vault.Rotation;
  progress?: number;
}) {
  const t = useText();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <div className={s.sectionHead}>
        <h2>
          {t(task.mode === 'RESTORE' ? 'manage.restore' : 'manage.rotation')}
        </h2>
        <span className={s.badge}>
          {t(
            task.status === 'COMMITTED'
              ? 'manage.committed'
              : task.status === 'CANCELLED'
                ? 'manage.cancelled'
                : task.status === 'EXPIRED' || now >= Date.parse(task.expiresAt)
                  ? 'manage.expired'
                  : 'manage.uploading',
          )}
        </span>
      </div>
      <Summary
        rows={[
          [t('vault.taskId'), task.rotationId],
          [
            t('manage.taskDeadline'),
            task.status === 'UPLOADING'
              ? t('manage.deadlineValue', {
                  minutes: Math.max(
                    0,
                    Math.ceil((Date.parse(task.expiresAt) - now) / 60000),
                  ),
                  time: new Date(task.expiresAt).toLocaleString(),
                })
              : new Date(task.expiresAt).toLocaleString(),
          ],
          [
            t('manage.itemProgress'),
            progress === undefined
              ? t('manage.progressAfterTakeover', {
                  count: task.expectedItemCount,
                })
              : `${progress} / ${task.expectedItemCount}`,
          ],
          [
            t('manage.liveData'),
            t(
              task.status === 'COMMITTED'
                ? 'manage.newDataActive'
                : task.mode === 'RESTORE'
                  ? 'manage.targetUncommitted'
                  : 'manage.oldDataReadable',
            ),
          ],
        ]}
      />
    </>
  );
}

export default function Transition({
  restore,
  existingTask,
}: {
  restore: boolean;
  existingTask?: Vault.Rotation;
}) {
  const t = useText();
  const {
    client,
    guard,
    execute,
    authorize,
    ownerSubject,
    busy,
    finish,
    navigate,
    setDirty,
    checkpoint,
  } = useManagement();
  const [material, setMaterial] = useState(emptyMaterial);
  const [backup, setBackup] = useState('');
  const [target, setTarget] = useState<'unchecked' | 'empty' | 'nonempty'>(
    'unchecked',
  );
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Vault.PreparedSetup>();
  const [filesVerified, setFilesVerified] = useState(false);
  const [task, setTask] = useState(existingTask);
  const [taskId, setTaskId] = useState(existingTask?.rotationId || '');
  const [progress, setProgress] = useState<number>();
  const [manifest, setManifest] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [newAccount, setNewAccount] = useState('');
  const [newRecovery, setNewRecovery] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const retentionDeadlines = useRef<string[]>([]);
  const preparedMeta = useRef<Vault.Meta | undefined>(undefined);
  const startRequest = useRef<Vault.RotationStart | undefined>(undefined);
  const commitRequest = useRef<Vault.RotationCommand | undefined>(undefined);
  const cancelRequest = useRef<Vault.RotationCommand | undefined>(undefined);
  const batches = useRef(
    new Map<string, { batchId: string; items: Vault.Item[] }>(),
  );
  const labels = restore
    ? ([
        'manage.restoreSource',
        'manage.restoreNew',
        'manage.filesStep',
        'manage.restoreEncrypt',
        'manage.restoreCommit',
      ] as const)
    : ([
        'manage.rotationSource',
        'manage.rotationNew',
        'manage.filesStep',
        'manage.rotationEncrypt',
        'manage.rotationCommit',
      ] as const);
  const checkEmpty = async () => {
    const meta = await guard(vault.meta());
    const empty =
      meta.status !== 'RESTORING' &&
      (!meta.initialized ||
        ((await guard(itemAPI.allItems(meta))).length === 0 &&
          (await guard(itemAPI.deletedItems(meta))).items.length === 0));
    setTarget(empty ? 'empty' : 'nonempty');
    return empty ? meta : undefined;
  };
  const proveSource = async () => {
    await guard(
      client.call('verifyBackup', {
        backup,
        file: material.file,
        password: material.recovery ? undefined : material.password,
      }),
    );
    if (!restore) {
      const source = parseBackup(backup).snapshot;
      const current = await guard(vault.meta());
      assert(
        source.ownerSubject === ownerSubject &&
          source.vaultId === current.vaultId &&
          source.metaRevision === current.metaRevision &&
          source.collectionRevision === current.collectionRevision,
      );
    }
  };
  const upload = async (current: Vault.Rotation) => {
    assert(
      current.status === 'UPLOADING' &&
        Date.now() < Date.parse(current.expiresAt),
    );
    setManifest('');
    if (current.mode === 'ROTATION') {
      const meta = await guard(vault.meta());
      const items = await guard(rotation.stagedItems(current, 'SOURCE', meta));
      retentionDeadlines.current = items.flatMap((item) =>
        item.deleted && item.purgeAt ? [item.purgeAt] : [],
      );
      for (let offset = 0; offset < Math.max(1, items.length); offset += 100)
        await guard(
          client.call('transitionSource', {
            items: items.slice(offset, offset + 100),
            reset: offset === 0,
          }),
        );
    }
    await guard(client.call('bindTransition', { task: current }));
    const staged = await guard(rotation.stagedItems(current));
    const accepted = new Set(staged.map((item) => item.itemId));
    setProgress(accepted.size);
    const remaining = current.expectedItems.filter(
      (item) => !accepted.has(item.itemId),
    );
    for (let offset = 0; offset < remaining.length; offset += 20) {
      const ids = remaining
        .slice(offset, offset + 20)
        .map((item) => item.itemId);
      const key = ids.join(',');
      let batch = batches.current.get(key);
      if (!batch) {
        batch = {
          batchId: crypto.randomUUID(),
          items: await guard(client.call('transitionBatch', { itemIds: ids })),
        };
        batches.current.set(key, batch);
      }
      await guard(
        rotation.batch(current.rotationId, batch.batchId, batch.items),
      );
      setProgress(accepted.size + Math.min(offset + 20, remaining.length));
    }
    const complete = await guard(rotation.stagedItems(current));
    for (let offset = 0; offset < Math.max(1, complete.length); offset += 100)
      await guard(
        client.call('ingestStaged', {
          items: complete.slice(offset, offset + 100),
          reset: offset === 0,
        }),
      );
    setManifest(await guard(client.call('verifyStaged', {})));
    setStep(4);
    setUncertain(false);
  };
  const query = async () => {
    setManifest('');
    const current = await guard(rotation.status(taskId));
    setTask(current);
    setUncertain(false);
    if (current.status === 'COMMITTED') {
      client.reset();
      setDraft(undefined);
      setMaterial(emptyMaterial());
      setNewPassword('');
      setNewAccount('');
      setNewRecovery('');
      setDirty(false);
      setStep(5);
    }
    return current;
  };
  const begin = async () => {
    assert(filesVerified);
    if (!startRequest.current) {
      const payload = await guard(client.call('transitionPayload', {}));
      const meta = await guard(vault.meta());
      assert(
        preparedMeta.current &&
          meta.metaRevision === preparedMeta.current.metaRevision &&
          meta.collectionRevision === preparedMeta.current.collectionRevision,
      );
      startRequest.current = {
        ...payload,
        rotationId: crypto.randomUUID(),
        expectedMetaRevision: meta.metaRevision,
        expectedCollectionRevision: meta.collectionRevision,
        idempotencyKey: crypto.randomUUID(),
      };
      setTaskId(startRequest.current.rotationId);
      checkpoint(startRequest.current.rotationId);
      saveTask(startRequest.current.rotationId, t('vault.taskFilename'));
    } else {
      // A lost start response must be resolved before retrying the identical request.
      try {
        const current = await guard(
          rotation.status(startRequest.current.rotationId),
        );
        setTask(current);
        if (current.status === 'UPLOADING') await upload(current);
        else setStep(5);
        return;
      } catch (error) {
        if (!(error instanceof VaultHttpError) || error.status !== 404)
          throw error;
      }
    }
    setUncertain(true);
    await guard(rotation.start(startRequest.current, restore));
    const current = await guard(
      rotation.status(startRequest.current.rotationId),
    );
    setTask(current);
    setUncertain(false);
    await upload(current);
  };
  const completion = (current: Vault.Rotation) => ({
    ownerSubject,
    rotationId: current.rotationId,
    mode: current.mode,
    generation: current.generation,
    keyEpoch: current.keyEpoch,
    count: current.expectedItemCount,
    retentionDeadlines: retentionDeadlines.current,
  });
  return (
    <>
      <Steps labels={labels.map((key) => t(key))} current={step} />
      {step === 0 && (
        <>
          {restore && !existingTask && (
            <div className={s.panel}>
              <div className={s.sectionHead}>
                <h3>{t('manage.targetAccount')}</h3>
                <span className={s.badge}>
                  {t(
                    target === 'empty'
                      ? 'manage.targetEmpty'
                      : target === 'nonempty'
                        ? 'manage.targetNotEmpty'
                        : 'manage.targetUnchecked',
                  )}
                </span>
              </div>
              <p className={s.muted}>{t('manage.emptyOnly')}</p>
              <div className={s.actions}>
                <Button
                  disabled={busy}
                  onClick={() =>
                    execute(async () => {
                      await checkEmpty();
                    })
                  }
                >
                  {t('manage.checkTarget')}
                </Button>
              </div>
              {target === 'nonempty' && (
                <Note warning>{t('vault.restoreEmptyOnly')}</Note>
              )}
            </div>
          )}
          <Stage
            title={t(
              existingTask
                ? 'manage.resumeMaterials'
                : restore
                  ? 'manage.restoreSource'
                  : 'manage.rotationSource',
            )}
          >
            {t(
              existingTask
                ? 'manage.originalOnly'
                : restore
                  ? 'manage.restoreSourceHint'
                  : 'manage.rotationSourceHint',
            )}
          </Stage>
          <FileField
            large
            label={t('manage.sourceBackup')}
            onChange={setBackup}
          />
          <MaterialForm
            source
            value={material}
            onChange={(value) => {
              setMaterial(value);
              setDirty(!!value.file || !!value.password);
            }}
          />
          {existingTask && (
            <>
              <FileField
                label={t('vault.newAccountFile')}
                validate={parseAccountFile}
                onChange={setNewAccount}
              />
              <FileField
                label={t('vault.newRecoveryFile')}
                validate={parseRecoveryFile}
                onChange={setNewRecovery}
              />
              <label className={s.field} htmlFor="resume-new-password">
                {t('vault.newMaster')}
                <PasswordInput
                  id="resume-new-password"
                  aria-label={t('vault.newMaster')}
                  value={newPassword}
                  autoComplete="off"
                  disabled={busy}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </label>
            </>
          )}
          {!restore && !existingTask && (
            <Button type="link" onClick={() => navigate('backup')}>
              {t('manage.needBackup')}
            </Button>
          )}
          <Note>{t('manage.recoveryIdentity')}</Note>
          <FlowFooter>
            <Button
              type="primary"
              disabled={
                busy ||
                !materialReady(material) ||
                !backup ||
                (restore && !existingTask && target !== 'empty') ||
                (!!existingTask &&
                  (!newAccount || !newRecovery || !newPassword))
              }
              onClick={() =>
                execute(async () => {
                  await proveSource();
                  if (existingTask) {
                    const current = await guard(
                      rotation.status(existingTask.rotationId),
                    );
                    setTask(current);
                    if (current.status !== 'UPLOADING') {
                      setStep(5);
                      return;
                    }
                    const meta = await guard(vault.meta());
                    if (current.mode === 'ROTATION') {
                      const items = await guard(
                        rotation.stagedItems(current, 'SOURCE', meta),
                      );
                      for (
                        let offset = 0;
                        offset < Math.max(1, items.length);
                        offset += 100
                      )
                        await guard(
                          client.call('transitionSource', {
                            items: items.slice(offset, offset + 100),
                            reset: offset === 0,
                          }),
                        );
                    }
                    await guard(
                      client.call('resumeTransition', {
                        ownerSubject,
                        meta,
                        task: current,
                        account: newAccount,
                        recovery: newRecovery,
                        password: newPassword,
                      }),
                    );
                    setFilesVerified(true);
                    setNewPassword('');
                    setNewAccount('');
                    setNewRecovery('');
                    setMaterial(emptyMaterial());
                    setBackup('');
                    setStep(3);
                    await upload(current);
                  } else {
                    setStep(1);
                    setDirty(true);
                  }
                })
              }
            >
              {t(
                existingTask ? 'manage.verifyResume' : 'manage.verifyContinue',
              )}
            </Button>
          </FlowFooter>
        </>
      )}
      {step === 1 && (
        <>
          <Stage
            title={t(restore ? 'manage.restoreNew' : 'manage.rotationNew')}
          >
            {t('manage.newMaterialsHint')}
          </Stage>
          <NewPassword
            label={t('manage.generateNew')}
            onNext={(password) =>
              execute(async () => {
                const meta = restore
                  ? await checkEmpty()
                  : await guard(vault.meta());
                assert(meta);
                preparedMeta.current = meta;
                setDraft(
                  await guard(
                    client.call('prepareTransition', {
                      ownerSubject,
                      meta,
                      password,
                      restore,
                    }),
                  ),
                );
                setFilesVerified(false);
                setStep(2);
              })
            }
          />
        </>
      )}
      {step === 2 && draft && (
        <>
          <Stage title={t('manage.saveNewFiles')}>
            {t('manage.newFilesHint')}
          </Stage>
          <NewFiles
            key={draft.keySlots[0].keyId}
            draft={draft}
            onVerified={setFilesVerified}
          />
          <FlowFooter
            back={() => {
              setFilesVerified(false);
              setDraft(undefined);
              setStep(1);
            }}
          >
            <Button
              type="primary"
              disabled={busy || !filesVerified}
              onClick={() => {
                setMaterial(emptyMaterial());
                setBackup('');
                setStep(3);
              }}
            >
              {t('manage.continueEncrypt')}
            </Button>
          </FlowFooter>
        </>
      )}
      {step >= 3 && task && (
        <div className={s.panel}>
          <TaskFacts task={task} progress={progress} />
        </div>
      )}
      {step === 3 && (
        <>
          <Stage title={t('manage.encryptTitle')}>
            {t('manage.encryptHint')}
          </Stage>
          {progress !== undefined && (
            <div className={s.panel}>
              <div className={s.progressHead}>
                <span>{t('manage.uploadProgress')}</span>
                <span>
                  {progress} / {task?.expectedItemCount ?? 0}
                </span>
              </div>
              <div
                className={s.progressTrack}
                role="progressbar"
                aria-label={t('manage.uploadProgress')}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={task?.expectedItemCount || 1}
              >
                <div
                  style={{
                    width: `${task?.expectedItemCount ? (progress / task.expectedItemCount) * 100 : 100}%`,
                  }}
                />
              </div>
              <div className={s.progressMeta}>
                <span>{t('manage.allContent')}</span>
                <span>{t('manage.noSecretsUpload')}</span>
              </div>
            </div>
          )}
          {uncertain && <Note warning>{t('manage.uncertain')}</Note>}
          <FlowFooter>
            {taskId && (
              <>
                <Button
                  onClick={() => saveTask(taskId, t('vault.taskFilename'))}
                >
                  {t('vault.saveTask')}
                </Button>
                <Button disabled={busy} onClick={() => execute(query)}>
                  {t('vault.queryTask')}
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => navigate('task', taskId)}
                >
                  {t('manage.later')}
                </Button>
              </>
            )}
            {!task ? (
              <Button
                type="primary"
                disabled={busy}
                onClick={() => authorize(t('vault.startRotation'), begin)}
              >
                {t(
                  uncertain ? 'manage.queryRetryStart' : 'vault.startRotation',
                )}
              </Button>
            ) : (
              task.status === 'UPLOADING' && (
                <Button
                  type="primary"
                  disabled={busy || uncertain}
                  onClick={() =>
                    execute(async () => {
                      const current = await query();
                      if (current.status === 'UPLOADING') await upload(current);
                    })
                  }
                >
                  {t('vault.retryUpload')}
                </Button>
              )
            )}
          </FlowFooter>
        </>
      )}
      {step === 4 && task && (
        <>
          <Stage title={t('manage.readyTitle')}>{t('manage.readyHint')}</Stage>
          <Summary
            rows={[
              [
                t('manage.dataVerified'),
                `${progress} / ${task.expectedItemCount}`,
              ],
              [t('vault.newAccountFile'), t('manage.fileVerified')],
              [t('vault.newRecoveryFile'), t('manage.fileVerified')],
              [t('manage.afterCommitUnlock'), t('manage.newUnlock')],
            ]}
          />
          <Note warning>
            {t(restore ? 'manage.restoreLastCheck' : 'manage.rotationHistory')}
          </Note>
          {uncertain && <Note warning>{t('manage.uncertain')}</Note>}
          <FlowFooter>
            <Button
              onClick={() => saveTask(task.rotationId, t('vault.taskFilename'))}
            >
              {t('vault.saveTask')}
            </Button>
            <Button
              disabled={busy}
              onClick={() => navigate('task', task.rotationId)}
            >
              {t('manage.later')}
            </Button>
            {uncertain ? (
              <Button
                type="primary"
                disabled={busy}
                onClick={() =>
                  execute(async () => {
                    const current = await query();
                    if (current.status === 'UPLOADING') {
                      setStep(3);
                      await upload(current);
                    }
                  })
                }
              >
                {t('vault.queryTask')}
              </Button>
            ) : (
              <Button
                type="primary"
                disabled={busy || !manifest || !filesVerified}
                onClick={() =>
                  authorize(t('manage.confirmSwitch'), async () => {
                    const current = await guard(
                      rotation.status(task.rotationId),
                    );
                    setTask(current);
                    if (current.status === 'COMMITTED') {
                      finish(completion(current));
                      return;
                    }
                    assert(
                      current.status === 'UPLOADING' &&
                        Date.now() < Date.parse(current.expiresAt),
                    );
                    commitRequest.current ||= {
                      rotationId: current.rotationId,
                      expectedCollectionRevision:
                        current.expectedCollectionRevision,
                      verifiedManifestDigest: manifest,
                      idempotencyKey: crypto.randomUUID(),
                    };
                    setUncertain(true);
                    rememberCompletion(completion(current));
                    await guard(rotation.commit(commitRequest.current));
                    finish(completion(current));
                  })
                }
              >
                {t(restore ? 'manage.restoreCommit' : 'manage.confirmSwitch')}
              </Button>
            )}
          </FlowFooter>
        </>
      )}
      {step >= 3 && task?.status === 'UPLOADING' && (
        <>
          <div className={s.actions}>
            <Button
              danger
              type="text"
              disabled={busy}
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
                      if (current.status === 'UPLOADING') {
                        cancelRequest.current ||= {
                          rotationId: current.rotationId,
                          idempotencyKey: crypto.randomUUID(),
                        };
                        setUncertain(true);
                        await guard(rotation.cancel(cancelRequest.current));
                        setTask(
                          await guard(rotation.status(current.rotationId)),
                        );
                        setUncertain(false);
                        client.reset();
                        setDraft(undefined);
                        setDirty(false);
                        setStep(5);
                      }
                      setCancelConfirm(false);
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
      )}
      {step === 5 &&
        task &&
        (task.status === 'COMMITTED' ? (
          <Result
            title={t('manage.submittedVerify')}
            actions={
              <Button
                type="primary"
                disabled={busy}
                onClick={() => finish(completion(task))}
              >
                {t('manage.reloginVerify')}
              </Button>
            }
          >
            {t('vault.committedHint')}
          </Result>
        ) : (
          <Result
            title={t(
              task.status === 'CANCELLED'
                ? 'manage.cancelled'
                : 'manage.expired',
            )}
            actions={
              <Button onClick={() => navigate('task', task.rotationId)}>
                {t('vault.queryTask')}
              </Button>
            }
          >
            {t('manage.terminalHint')}
          </Result>
        ))}
    </>
  );
}
