import { App, Button } from 'antd';
import { Copy, Eye, EyeOff, ScanLine } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import styles from './Entries.module.css';
import { useText } from './text';

export default function TotpView(props: {
  itemId: string;
  disabled: boolean;
  info?: Vault.TotpInfo | null;
  actions?: ReactNode;
  onCode: (id: string) => Promise<Vault.TotpCode>;
}) {
  const t = useText();
  const { message } = App.useApp();
  const [code, setCode] = useState<Vault.TotpCode>();
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState(false);
  const [fallback, setFallback] = useState(false);
  const serial = useRef(0);
  const fetching = useRef(false);
  const hide = () => {
    serial.current++;
    setUntil(0);
    setCode(undefined);
    setFallback(false);
  };
  const currentCode = async (current: number) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const value = await props.onCode(props.itemId);
      const time = Date.now();
      if (current !== serial.current || document.hidden) return;
      if (time >= value.validFrom && time < value.validUntil) return value;
    }
    throw new Error('VAULT_INVALID_FORMAT');
  };
  useEffect(() => {
    const visibility = () => hide();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide();
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('keydown', onEscape);
    return () => {
      serial.current++;
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('keydown', onEscape);
    };
  }, []);
  useEffect(() => {
    if (!until) return;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (performance.now() >= until || document.hidden) {
        hide();
        return;
      }
      if (code && time >= code.validFrom && time < code.validUntil) return;
      setCode(undefined);
      if (fetching.current) return;
      fetching.current = true;
      const current = serial.current;
      void currentCode(current)
        .then((value) => {
          if (current === serial.current && performance.now() < until)
            setCode(value);
        })
        .catch(() => {
          if (current === serial.current) {
            hide();
            setError(true);
          }
        })
        .finally(() => {
          fetching.current = false;
        });
    };
    tick();
    const timer = setInterval(tick, 200);
    return () => clearInterval(timer);
  }, [until, code]);
  const valid =
    code &&
    now >= code.validFrom &&
    now < code.validUntil &&
    performance.now() < until
      ? code
      : undefined;
  return (
    <section className={styles.totpPanel} aria-label={t('vault.totp')}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3>
            {t('vault.totp')} <small>2FA</small>
          </h3>
          {props.info && (
            <p className={styles.help}>
              {props.info.issuer || props.info.accountName} ·{' '}
              {t('entries.period', { seconds: props.info.period })}
            </p>
          )}
        </div>
        <ScanLine size={18} aria-hidden="true" />
      </div>
      <div className={styles.codeRow}>
        <output
          className={styles.code}
          aria-label={t(valid ? 'entries.currentCode' : 'entries.hiddenCode')}
        >
          {valid
            ? valid.code.replace(/(.{3,4})(?=.{3,4}$)/, '$1 ')
            : props.info?.digits === 8
              ? '•••• ••••'
              : '••• •••'}
        </output>
        <div className="flex gap-2">
          <Button
            disabled={props.disabled}
            aria-label={t(until ? 'vault.hideNow' : 'vault.totpShow')}
            icon={until ? <EyeOff size={17} /> : <Eye size={17} />}
            onClick={() => {
              if (until) hide();
              else {
                setError(false);
                setNow(Date.now());
                setUntil(performance.now() + 20000);
              }
            }}
          />
          <Button
            type="primary"
            aria-label={t('vault.totpCopy')}
            disabled={props.disabled}
            icon={<Copy size={16} />}
            onClick={async () => {
              const current = serial.current;
              setError(false);
              try {
                const value = await currentCode(current);
                if (
                  !value ||
                  current !== serial.current ||
                  document.hidden ||
                  Date.now() >= value.validUntil
                )
                  return;
                try {
                  await navigator.clipboard.writeText(value.code);
                  if (current === serial.current && !document.hidden)
                    message.success(t('vault.copied'));
                } catch {
                  if (current === serial.current && !document.hidden) {
                    setNow(Date.now());
                    setCode(value);
                    setUntil(
                      performance.now() +
                        Math.min(20000, value.validUntil - Date.now()),
                    );
                    setFallback(true);
                  }
                }
              } catch {
                if (current === serial.current) setError(true);
              }
            }}
          >
            {t('entries.copy')}
          </Button>
        </div>
      </div>
      <p className={styles.help} role="timer">
        {valid
          ? t('entries.codeCountdown', {
              update: Math.ceil((valid.validUntil - now) / 1000),
              hide: Math.max(0, Math.ceil((until - performance.now()) / 1000)),
            })
          : t('entries.codeHint')}
      </p>
      {valid && (
        <progress
          className={styles.progress}
          max={valid.validUntil - valid.validFrom}
          value={valid.validUntil - now}
          aria-label={t('entries.codeWindow')}
        />
      )}
      {fallback && valid && <p role="status">{t('vault.copyFailed')}</p>}
      {error && (
        <p className={styles.error} role="alert">
          {t('vault.totpClock')}
        </p>
      )}
      {props.actions && (
        <div className={styles.totpActions}>{props.actions}</div>
      )}
    </section>
  );
}
