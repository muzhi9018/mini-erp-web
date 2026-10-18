import { Button, Input, Select, Tabs } from 'antd';
import { ArrowLeft, Image, KeyRound, Link, ScanLine, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  normalizeTotp,
  parseTotpURI,
  TotpImportError,
} from '@/security/vault/totp';
import styles from './Entries.module.css';
import { readQR } from './qr';
import TotpView from './TotpView';
import { type MessageKey, useText } from './text';

export default function TotpImportWizard(props: {
  title: string;
  username: string;
  disabled: boolean;
  onClose: () => void;
  onAdd: (value: Vault.Totp) => void;
  onCode: (value: Vault.Totp) => Promise<Vault.TotpCode>;
}) {
  const t = useText();
  const [method, setMethod] = useState('image');
  const [uri, setUri] = useState('');
  const [manual, setManual] = useState<Vault.Totp>({
    secretBase32: '',
    issuer: props.title,
    accountName: props.username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });
  const [pending, setPending] = useState<Vault.Totp>();
  const [error, setError] = useState<MessageKey>();
  const [reading, setReading] = useState(false);
  const serial = useRef(0);
  const controller = useRef<AbortController | undefined>(undefined);
  const fileInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const clear = () => {
    serial.current++;
    controller.current?.abort();
    setUri('');
    setManual((value) => ({ ...value, secretBase32: '' }));
    setPending(undefined);
  };
  useEffect(() => {
    heading.current?.focus();
    const hide = () => {
      if (document.hidden) {
        clear();
        props.onClose();
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      serial.current++;
      controller.current?.abort();
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [pending]);
  const failure = (value: unknown, image = false) => {
    setError(
      value instanceof TotpImportError
        ? value.reason === 'issuer'
          ? 'entries.issuerError'
          : value.reason === 'parameters'
            ? 'entries.parametersError'
            : 'entries.uriError'
        : image
          ? 'entries.imageError'
          : 'vault.totpInvalid',
    );
  };
  const read = (value: string) => {
    const config = parseTotpURI(value);
    setPending(config);
    setUri('');
    setError(undefined);
  };
  const controls = (
    <>
      <label className={styles.field} htmlFor="totp-issuer">
        {t('vault.totpIssuer')}
        <Input
          id="totp-issuer"
          value={manual.issuer}
          maxLength={256}
          onChange={(e) => setManual({ ...manual, issuer: e.target.value })}
        />
      </label>
      <label className={styles.field} htmlFor="totp-account">
        {t('vault.totpAccount')}
        <Input
          id="totp-account"
          value={manual.accountName}
          maxLength={256}
          onChange={(e) =>
            setManual({ ...manual, accountName: e.target.value })
          }
        />
      </label>
    </>
  );
  const importFields = (
    <fieldset
      className={styles.importFields}
      disabled={props.disabled || reading}
    >
      {method === 'image' ? (
        <>
          <div className={styles.dropzone}>
            <ScanLine size={24} />
            <h3>{t('entries.chooseImageTitle')}</h3>
            <p className={styles.help}>{t('entries.imageHint')}</p>
            <input
              ref={fileInput}
              type="file"
              hidden
              accept="image/png,image/jpeg,image/webp"
              aria-label={t('entries.chooseImage')}
              onChange={async (event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                if (!file) return;
                const current = ++serial.current;
                controller.current?.abort();
                controller.current = new AbortController();
                setReading(true);
                setError(undefined);
                try {
                  if (
                    !['image/png', 'image/jpeg', 'image/webp'].includes(
                      file.type,
                    ) ||
                    file.size > 2 * 1024 * 1024 ||
                    file.size === 0
                  ) {
                    setError('entries.imageLimits');
                    return;
                  }
                  const value = await readQR(file, controller.current.signal);
                  if (current === serial.current && !document.hidden)
                    read(value);
                } catch (value) {
                  if (current === serial.current) failure(value, true);
                } finally {
                  if (current === serial.current) setReading(false);
                }
              }}
            />
            <Button
              loading={reading}
              onClick={() => fileInput.current?.click()}
            >
              {t('entries.chooseImage')}
            </Button>
          </div>
          <details className={styles.advanced}>
            <summary>{t('entries.imageLimitsTitle')}</summary>
            <p className={styles.help}>{t('entries.imageLimits')}</p>
          </details>
        </>
      ) : method === 'key' ? (
        <>
          <label className={styles.field} htmlFor="totp-key">
            {t('entries.setupKey')}
            <Input
              id="totp-key"
              type="password"
              autoComplete="new-password"
              value={manual.secretBase32}
              maxLength={256}
              onChange={(e) =>
                setManual({ ...manual, secretBase32: e.target.value })
              }
            />
          </label>
          <p className={styles.help}>{t('entries.keyHint')}</p>
          <div className={styles.formGrid}>{controls}</div>
          <details className={styles.advanced}>
            <summary>{t('entries.advanced')}</summary>
            <div className={styles.formGrid}>
              <label className={styles.field} htmlFor="totp-algorithm">
                {t('vault.totpAlgorithm')}
                <Select
                  disabled={props.disabled || reading}
                  id="totp-algorithm"
                  value={manual.algorithm}
                  options={['SHA1', 'SHA256', 'SHA512'].map((value) => ({
                    value,
                    label: value,
                  }))}
                  onChange={(algorithm) => setManual({ ...manual, algorithm })}
                />
              </label>
              <label className={styles.field} htmlFor="totp-digits">
                {t('vault.totpDigits')}
                <Select
                  disabled={props.disabled || reading}
                  id="totp-digits"
                  value={manual.digits}
                  options={[6, 8].map((value) => ({
                    value,
                    label: value,
                  }))}
                  onChange={(digits) => setManual({ ...manual, digits })}
                />
              </label>
              <label className={styles.field} htmlFor="totp-period">
                {t('vault.totpPeriod')}
                <Select
                  disabled={props.disabled || reading}
                  id="totp-period"
                  value={manual.period}
                  options={[30, 60].map((value) => ({
                    value,
                    label: `${value}s`,
                  }))}
                  onChange={(period) => setManual({ ...manual, period })}
                />
              </label>
            </div>
          </details>
        </>
      ) : (
        <label className={styles.field} htmlFor="totp-link">
          {t('entries.uriTab')}
          <Input.TextArea
            id="totp-link"
            autoComplete="off"
            rows={4}
            value={uri}
            maxLength={4096}
            onChange={(e) => setUri(e.target.value)}
          />
        </label>
      )}
      {method !== 'image' && (
        <Button
          type="primary"
          onClick={() => {
            setError(undefined);
            try {
              if (method === 'uri') read(uri);
              else {
                if (/^\s*\d{6,8}\s*$/.test(manual.secretBase32)) {
                  setError('entries.shortCodeError');
                  return;
                }
                setPending(normalizeTotp(manual));
                setManual({ ...manual, secretBase32: '' });
              }
            } catch (value) {
              failure(value);
            }
          }}
        >
          {t('entries.readContinue')}
        </Button>
      )}
    </fieldset>
  );
  return (
    <div className={styles.editorContent}>
      <div className={styles.editorHead}>
        <div>
          <p className={styles.help}>
            {props.title || t('vault.newItem')} / {t('vault.totp')}
          </p>
          <h2 ref={heading} tabIndex={-1}>
            {t('vault.totpAdd')}
          </h2>
        </div>
        <Button
          type="text"
          aria-label={t('entries.closeImport')}
          icon={<X size={18} />}
          onClick={() => {
            clear();
            props.onClose();
          }}
        />
      </div>
      <ol className={styles.wizardSteps} aria-label={t('entries.importSteps')}>
        <li aria-current={!pending ? 'step' : undefined}>
          <b>1</b>
          {t('entries.importStep')}
        </li>
        <li aria-current={pending ? 'step' : undefined}>
          <b>2</b>
          {t('entries.reviewStep')}
        </li>
      </ol>
      {pending ? (
        <>
          <p className={styles.status}>{t('entries.formatReady')}</p>
          <dl className={styles.summary}>
            <dt>{t('vault.totpIssuer')}</dt>
            <dd>{pending.issuer || t('vault.notFilled')}</dd>
            <dt>{t('vault.totpAccount')}</dt>
            <dd>{pending.accountName || t('vault.notFilled')}</dd>
            <dt>{t('entries.setupKey')}</dt>
            <dd>•••• •••• •••• ••••</dd>
            <dt>{t('entries.codeRule')}</dt>
            <dd>
              {t('entries.rule', {
                digits: pending.digits,
                seconds: pending.period,
              })}
            </dd>
          </dl>
          <details className={styles.advanced}>
            <summary>{t('entries.advanced')}</summary>
            <p>{pending.algorithm} · T0 = 0</p>
          </details>
          <TotpView
            key="pending"
            itemId="draft"
            info={pending}
            disabled={props.disabled}
            onCode={() => props.onCode(pending)}
          />
          <p className={styles.warning}>{t('entries.websiteConfirm')}</p>
          <div className={styles.dialogActions}>
            <Button
              onClick={() => {
                setPending(undefined);
                setError(undefined);
              }}
            >
              {t('entries.reimport')}
            </Button>
            <Button
              type="primary"
              disabled={props.disabled}
              onClick={() => {
                props.onAdd(pending);
                clear();
              }}
            >
              {t('entries.addToEntry')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.help}>{t('entries.importHint')}</p>
          <Tabs
            className={styles.importTabs}
            activeKey={method}
            onChange={(key) => {
              clear();
              setMethod(key);
              setError(undefined);
              setReading(false);
            }}
            destroyOnHidden
            items={[
              {
                key: 'image',
                children: method === 'image' ? importFields : null,
                label: (
                  <span>
                    <Image size={17} />
                    {t('entries.imageTab')}
                  </span>
                ),
              },
              {
                key: 'key',
                children: method === 'key' ? importFields : null,
                label: (
                  <span>
                    <KeyRound size={17} />
                    {t('entries.keyTab')}
                  </span>
                ),
              },
              {
                key: 'uri',
                children: method === 'uri' ? importFields : null,
                label: (
                  <span>
                    <Link size={17} />
                    {t('entries.uriTab')}
                  </span>
                ),
              },
            ]}
          />

          {error && (
            <p className={styles.error} role="alert">
              {t(error)}
            </p>
          )}
          <p className={styles.warning}>{t('vault.totpRisk')}</p>
        </>
      )}
      <Button
        className="mt-5"
        type="link"
        icon={<ArrowLeft size={16} />}
        onClick={() => {
          clear();
          props.onClose();
        }}
      >
        {t('entries.backEditor')}
      </Button>
    </div>
  );
}
