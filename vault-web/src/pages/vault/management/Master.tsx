import { Button } from 'antd';
import { useRef, useState } from 'react';
import { assert } from '@/security/vault/protocol';
import * as vault from '@/services/vault/vault';
import { useText } from '../text';
import {
  emptyMaterial,
  FlowFooter,
  MaterialForm,
  materialReady,
  NewPassword,
  Note,
  Stage,
  Steps,
  Summary,
  useManagement,
} from './shared';

export default function Master() {
  const t = useText();
  const {
    client,
    guard,
    execute,
    authorize,
    ownerSubject,
    busy,
    finish,
    setDirty,
    navigate,
  } = useManagement();
  const [material, setMaterial] = useState(emptyMaterial);
  const [step, setStep] = useState(0);
  const [meta, setMeta] = useState<Vault.Meta>();
  const [uncertain, setUncertain] = useState(false);
  const request = useRef<Parameters<typeof vault.changeMaster>[0] | undefined>(
    undefined,
  );
  return (
    <>
      <Steps
        labels={[
          t('manage.masterVerify'),
          t('manage.masterNew'),
          t('manage.masterConfirm'),
        ]}
        current={step}
      />
      {step === 0 && (
        <>
          <Stage title={t('manage.masterVerifyTitle')}>
            {t('manage.masterOnlyNormal')}
          </Stage>
          <MaterialForm
            normalOnly
            value={material}
            onChange={(value) => {
              setMaterial(value);
              setDirty(!!value.file || !!value.password);
            }}
          />
          <Note>
            {t('manage.masterRecoveryHint')}{' '}
            <Button type="link" onClick={() => navigate('rotation')}>
              {t('manage.rotation')}
            </Button>
          </Note>
          <FlowFooter>
            <Button
              type="primary"
              disabled={busy || !materialReady(material)}
              onClick={() =>
                execute(async () => {
                  const value = await guard(vault.meta());
                  await guard(
                    client.call('unlock', {
                      ownerSubject,
                      meta: value,
                      account: material.file,
                      password: material.password,
                    }),
                  );
                  setMeta(value);
                  setStep(1);
                })
              }
            >
              {t('manage.verifyContinue')}
            </Button>
          </FlowFooter>
        </>
      )}
      {step === 1 && (
        <>
          <Stage title={t('manage.masterNew')} />
          <Note warning>{t('manage.masterHistory')}</Note>
          <NewPassword
            onNext={(password) =>
              execute(async () => {
                assert(meta && !material.recovery);
                request.current = await guard(
                  client.call('changeMaster', {
                    meta,
                    account: material.file,
                    oldPassword: material.password,
                    newPassword: password,
                  }),
                );
                setMaterial(emptyMaterial());
                setStep(2);
              })
            }
          />
        </>
      )}
      {step === 2 && (
        <>
          <Stage title={t('manage.masterConfirm')}>
            {t('manage.masterSession')}
          </Stage>
          <Summary
            rows={[
              [t('manage.changes'), t('vault.masterPassword')],
              [t('vault.accountFile'), t('manage.staysValid')],
              [t('vault.recoveryFile'), t('manage.staysValid')],
              [t('manage.history'), t('manage.historyMaterials')],
            ]}
          />
          {uncertain ? (
            <>
              <Note warning>{t('manage.masterUncertain')}</Note>
              <FlowFooter>
                <Button
                  disabled={busy}
                  onClick={() =>
                    execute(async () => {
                      const current = await guard(vault.meta());
                      if (
                        current.keySlots?.some(
                          (slot) =>
                            slot.slotId === request.current?.normalSlot.slotId,
                        )
                      ) {
                        finish();
                        return;
                      }
                      assert(
                        current.metaRevision ===
                          request.current?.expectedMetaRevision,
                      );
                      setUncertain(false);
                    })
                  }
                >
                  {t('manage.checkMasterResult')}
                </Button>
                <Button onClick={() => finish()}>
                  {t('manage.loginNewMaster')}
                </Button>
              </FlowFooter>
            </>
          ) : (
            <FlowFooter>
              <Button
                type="primary"
                disabled={busy}
                onClick={() =>
                  authorize(t('manage.masterConfirm'), async () => {
                    assert(request.current);
                    setUncertain(true);
                    await guard(vault.changeMaster(request.current));
                    finish();
                  })
                }
              >
                {t('manage.masterCommit')}
              </Button>
            </FlowFooter>
          )}
        </>
      )}
    </>
  );
}
