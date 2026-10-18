import { Button } from 'antd';
import { useState } from 'react';
import { assert } from '@/security/vault/protocol';
import * as vault from '@/services/vault/vault';
import { downloadFile } from '../files';
import { useText } from '../text';
import s from './Management.module.css';
import {
  emptyMaterial,
  FileField,
  FlowFooter,
  MaterialForm,
  materialReady,
  Note,
  Result,
  Stage,
  Steps,
  Summary,
  useManagement,
} from './shared';

function BackupFlow({ existing }: { existing: boolean }) {
  const t = useText();
  const { client, execute, authorize, guard, ownerSubject, busy, setDirty } =
    useManagement();
  const [material, setMaterial] = useState(emptyMaterial);
  const [backup, setBackup] = useState('');
  const [exported, setExported] = useState('');
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(0);
  const verify = async () => {
    if (!existing) assert(backup === exported);
    setCount(
      await guard(
        client.call('verifyBackup', {
          backup,
          file: material.file,
          password: material.recovery ? undefined : material.password,
        }),
      ),
    );
    setMaterial(emptyMaterial());
    setBackup('');
    setExported('');
    setStep(3);
    setDirty(false);
    client.reset();
  };
  return (
    <>
      {!existing && (
        <Steps
          labels={[
            t('manage.backupUnlock'),
            t('manage.backupExport'),
            t('manage.backupRoundtrip'),
          ]}
          current={step}
        />
      )}
      {step === 3 ? (
        <Result
          title={t(existing ? 'manage.existingValid' : 'manage.backupComplete')}
          actions={
            <Button
              type="primary"
              onClick={() => {
                setStep(0);
              }}
            >
              {t('manage.verifyAnother')}
            </Button>
          }
        >
          {t('vault.backupValid', { count })} {t('manage.backupLocal')}
        </Result>
      ) : (
        <>
          {step === 0 && (
            <>
              <Stage
                title={t(
                  existing
                    ? 'manage.existingTitle'
                    : 'manage.backupUnlockTitle',
                )}
              >
                {t('manage.localMaterials')}
              </Stage>
              {existing && (
                <FileField
                  large
                  label={t('vault.backupFile')}
                  onChange={setBackup}
                />
              )}
              <MaterialForm
                value={material}
                source={existing}
                onChange={(value) => {
                  setMaterial(value);
                  setDirty(!!value.file || !!value.password);
                }}
              />
              <Note>{t('manage.backupExcludes')}</Note>
              <FlowFooter>
                <Button
                  type="primary"
                  disabled={
                    busy || !materialReady(material) || (existing && !backup)
                  }
                  onClick={() =>
                    existing
                      ? execute(verify)
                      : authorize(t('manage.backupUnlock'), async () => {
                          const meta = await guard(vault.meta());
                          if (material.recovery)
                            await guard(
                              client.call('unlockRecovery', {
                                meta,
                                ownerSubject,
                                recovery: material.file,
                              }),
                            );
                          else
                            await guard(
                              client.call('unlock', {
                                meta,
                                ownerSubject,
                                account: material.file,
                                password: material.password,
                              }),
                            );
                          const snapshot = await guard(vault.snapshot());
                          setExported(
                            await guard(
                              client.call('exportBackup', { snapshot }),
                            ),
                          );
                          setCount(snapshot.items.length);
                          setStep(1);
                        })
                  }
                >
                  {t(existing ? 'vault.verifyBackup' : 'manage.backupUnlock')}
                </Button>
              </FlowFooter>
            </>
          )}
          {step === 1 && (
            <>
              <Stage title={t('manage.snapshotChecked')}>
                {t('manage.snapshotAuth')}
              </Stage>
              <Summary
                rows={[
                  [t('manage.content'), t('manage.backupContents', { count })],
                  [t('manage.excludes'), t('manage.backupExcludes')],
                ]}
              />
              <Note>{t('manage.backupScope')}</Note>
              <FlowFooter
                back={() => {
                  client.reset();
                  setExported('');
                  setStep(0);
                }}
              >
                <Button
                  type="primary"
                  disabled={busy}
                  onClick={() =>
                    authorize(t('manage.backupExport'), async () => {
                      downloadFile(
                        t('vault.encryptedBackupFilename'),
                        exported,
                      );
                      setStep(2);
                    })
                  }
                >
                  {t('manage.backupExport')}
                </Button>
              </FlowFooter>
            </>
          )}
          {step === 2 && (
            <>
              <Stage title={t('manage.roundtripTitle')}>
                {t('manage.roundtripHint')}
              </Stage>
              <FileField
                large
                label={t('manage.exportedBackup')}
                onChange={setBackup}
              />
              <Note warning>{t('manage.exportedUnverified')}</Note>
              <FlowFooter>
                <Button
                  type="primary"
                  disabled={busy || !backup}
                  onClick={() => execute(verify)}
                >
                  {t('manage.verifyFinish')}
                </Button>
              </FlowFooter>
            </>
          )}
        </>
      )}
    </>
  );
}
export default function Backup() {
  const t = useText();
  const { busy, navigate } = useManagement();
  const [existing, setExisting] = useState(false);
  const [revision, setRevision] = useState(0);
  // Use the shell's leave confirmation for a task change, including secrets and files.
  const { setDirty, client } = useManagement();
  const [switchTo, setSwitchTo] = useState<boolean>();
  return (
    <>
      <fieldset className={s.tabs} aria-label={t('manage.backupOperation')}>
        {[false, true].map((value) => (
          <button
            key={String(value)}
            type="button"
            disabled={busy}
            className={`${s.tab} ${existing === value ? s.selectedTab : ''}`}
            aria-pressed={existing === value}
            onClick={() => {
              if (existing !== value) setSwitchTo(value);
            }}
          >
            {t(value ? 'manage.verifyExisting' : 'manage.createBackup')}
          </button>
        ))}
      </fieldset>
      {switchTo !== undefined && (
        <div className={s.panel} role="alert">
          <p>{t('manage.leaveHint')}</p>
          <div className={s.actions}>
            <Button
              onClick={() => {
                client.reset();
                setDirty(false);
                setExisting(switchTo);
                setRevision((v) => v + 1);
                setSwitchTo(undefined);
              }}
            >
              {t('manage.leaveClear')}
            </Button>
            <Button onClick={() => setSwitchTo(undefined)}>
              {t('vault.cancel')}
            </Button>
          </div>
        </div>
      )}
      <BackupFlow key={`${existing}-${revision}`} existing={existing} />
      <Button type="link" disabled={busy} onClick={() => navigate('rotation')}>
        {t('manage.goRotation')}
      </Button>
    </>
  );
}
