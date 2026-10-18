import { Button, Input } from 'antd';
import { Fingerprint, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { assert, decode, object, uuid } from '@/security/vault/protocol';
import { createPasskey } from '@/security/vault/webauthn';
import * as auth from '@/services/vault/session';
import { useText } from '../text';
import s from './Management.module.css';
import {
  FileExport,
  FlowFooter,
  Note,
  Result,
  Stage,
  Steps,
  useManagement,
} from './shared';

export default function Credentials() {
  const t = useText();
  const { execute, guard, authorize, busy, finish, setDirty } = useManagement();
  const [passkeys, setPasskeys] = useState<Vault.Passkey[]>();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [revoke, setRevoke] = useState<Vault.Passkey>();
  const [viewCodes, setViewCodes] = useState(false);
  const [codes, setCodes] = useState<Vault.RecoveryCodes>();
  const [verified, setVerified] = useState(false);
  const [done, setDone] = useState(false);
  const expires = useRef(0);
  const [expired, setExpired] = useState(false);
  const refresh = async () => setPasskeys(await guard(auth.passkeys()));
  useEffect(() => {
    execute(refresh);
  }, []);
  useEffect(() => {
    if (!codes) return;
    const timer = setInterval(() => {
      if (Date.now() >= expires.current) {
        setCodes(undefined);
        setVerified(false);
        setExpired(true);
        setDirty(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [codes]);
  if (viewCodes)
    return (
      <>
        <Steps
          labels={[
            t('manage.codesGenerate'),
            t('manage.codesSave'),
            t('manage.codesConfirm'),
          ]}
          current={done ? 3 : codes ? (verified ? 2 : 1) : 0}
        />
        {done ? (
          <Result
            title={t('vault.codesReplaced')}
            actions={
              <Button
                type="primary"
                onClick={() => {
                  setViewCodes(false);
                  setDone(false);
                }}
              >
                {t('manage.backCredentials')}
              </Button>
            }
          >
            {t('manage.codesDistinct')}
          </Result>
        ) : (
          <>
            <Stage
              title={t(
                codes ? 'manage.codesSaveTitle' : 'manage.codesGenerate',
              )}
            >
              {t('manage.codesDistinct')}
            </Stage>
            <Note warning={expired}>
              {t(expired ? 'manage.codesExpired' : 'manage.codesPending')}
            </Note>
            {codes ? (
              <>
                <div className={s.panel}>
                  <FileExport
                    key={codes.batchId}
                    label={t('vault.downloadCodes')}
                    name="vault-mfa-recovery-codes.json"
                    content={JSON.stringify(codes)}
                    onVerified={setVerified}
                  />
                </div>
                <Note warning>{t('manage.codesTime')}</Note>
                <FlowFooter>
                  <Button
                    type="primary"
                    disabled={!verified || busy}
                    onClick={() =>
                      authorize(t('manage.codesConfirm'), async () => {
                        assert(Date.now() < expires.current);
                        await guard(
                          auth.confirmCodes(
                            codes.batchId,
                            codes.credentialRevision,
                          ),
                        );
                        setCodes(undefined);
                        setVerified(false);
                        setDone(true);
                        setDirty(false);
                      })
                    }
                  >
                    {t('manage.codesConfirm')}
                  </Button>
                </FlowFooter>
              </>
            ) : (
              <FlowFooter back={() => setViewCodes(false)}>
                <Button
                  type="primary"
                  disabled={busy}
                  onClick={() =>
                    authorize(t('manage.codesGenerate'), async () => {
                      const session = await guard(auth.options());
                      assert(session.credentialRevision);
                      const issuedAt = Date.now();
                      const value = await guard(
                        auth.issueCodes(session.credentialRevision),
                      );
                      const parsed = object(value);
                      uuid(parsed.batchId);
                      assert(
                        value.formatVersion === 1 &&
                          value.ownerSubject === session.ownerSubject &&
                          value.credentialRevision ===
                            session.credentialRevision &&
                          Array.isArray(value.codes) &&
                          value.codes.length === 8 &&
                          new Set(value.codes).size === 8,
                      );
                      value.codes.forEach((code) => {
                        decode(code, 32).fill(0);
                      });
                      expires.current = issuedAt + 600_000;
                      setCodes(value);
                      setVerified(false);
                      setExpired(false);
                      setDirty(true);
                    })
                  }
                >
                  {t('manage.codesGenerate')}
                </Button>
              </FlowFooter>
            )}
          </>
        )}
      </>
    );
  return (
    <>
      <div className={s.sectionHead}>
        <h2>Passkey</h2>
        <small>
          {passkeys
            ? t('manage.passkeyCount', { count: passkeys.length })
            : t('vault.syncing')}
        </small>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          disabled={busy}
          onClick={() => setAdding(true)}
        >
          {t('manage.addPasskey')}
        </Button>
      </div>
      <div className={s.panel}>
        {passkeys?.map((key) => (
          <div className={s.device} key={key.credentialId}>
            <span className={s.deviceIcon}>
              <Fingerprint size={19} />
            </span>
            <div className={s.deviceContent}>
              <h3>{key.label}</h3>
              {key.lastUsedAt && (
                <p>
                  {t('manage.lastUsed', {
                    time: new Date(key.lastUsedAt).toLocaleString(),
                  })}
                </p>
              )}
            </div>
            <Button
              type="text"
              danger
              disabled={busy || passkeys.length <= 1}
              onClick={() => setRevoke(key)}
            >
              {t('vault.revoke')}
            </Button>
          </div>
        ))}
        {!passkeys && (
          <Button disabled={busy} onClick={() => execute(refresh)}>
            {t('vault.listPasskeys')}
          </Button>
        )}
      </div>
      <p className={s.muted}>{t('manage.lastPasskey')}</p>
      {revoke && (
        <div className={s.inlineForm} role="alert">
          <Stage title={t('manage.revokeTitle')}>{revoke.label}</Stage>
          <p className={s.muted}>{t('vault.revokeWarning')}</p>
          <div className={s.actions}>
            <Button
              danger
              disabled={busy}
              onClick={() =>
                authorize(t('vault.revoke'), async () => {
                  const current = await guard(auth.passkeys());
                  assert(
                    current.length > 1 &&
                      current.some(
                        (key) => key.credentialId === revoke.credentialId,
                      ),
                  );
                  const session = await guard(auth.options());
                  assert(session.credentialRevision);
                  await guard(
                    auth.revoke(
                      revoke.credentialId,
                      session.credentialRevision,
                    ),
                  );
                  finish();
                })
              }
            >
              {t('vault.confirmAction')}
            </Button>
            <Button disabled={busy} onClick={() => setRevoke(undefined)}>
              {t('vault.cancel')}
            </Button>
          </div>
        </div>
      )}
      {adding && (
        <div className={s.inlineForm}>
          <Stage title={t('manage.addPasskey')}>
            {t('manage.addPasskeyHint')}
          </Stage>
          <label className={s.field} htmlFor="management-passkey-label">
            {t('vault.passkeyLabel')}
            <Input
              id="management-passkey-label"
              value={label}
              maxLength={100}
              disabled={busy}
              onChange={(event) => setLabel(event.target.value)}
            />
          </label>
          <div className={s.actions}>
            <Button
              type="primary"
              disabled={busy || !label.trim()}
              onClick={() =>
                authorize(t('manage.addPasskey'), async () => {
                  const options = await guard(auth.registerOptions());
                  const credential = await guard(createPasskey(options));
                  await guard(auth.register(label, credential));
                  await refresh();
                  setAdding(false);
                  setLabel('');
                })
              }
            >
              {t('vault.register')}
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                setAdding(false);
                setLabel('');
              }}
            >
              {t('vault.cancel')}
            </Button>
          </div>
        </div>
      )}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2>{t('manage.mfaCodes')}</h2>
        </div>
        <div className={s.panel}>
          <h3>{t('manage.codesTitle')}</h3>
          <p className={s.muted}>{t('manage.codesDistinct')}</p>
          <div className={s.actions}>
            <Button
              icon={<RefreshCw size={16} />}
              disabled={busy}
              onClick={() => setViewCodes(true)}
            >
              {t('manage.updateCodes')}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
