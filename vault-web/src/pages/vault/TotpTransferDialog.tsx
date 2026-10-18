import { Button, Input, Modal, QRCode } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { trapDialogTab } from './dialog';
import styles from './Entries.module.css';
import { type MessageKey, useText } from './text';

export default function TotpTransferDialog(props: {
  itemId: string;
  info: Vault.TotpInfo;
  onClose: () => void;
  onExport: (itemId: string, signal: AbortSignal) => Promise<string>;
  onCode: (itemId: string) => Promise<Vault.TotpCode>;
}) {
  const t = useText();
  const [uri, setUri] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey>();
  const [seconds, setSeconds] = useState(60);
  const [input, setInput] = useState('');
  const [match, setMatch] = useState<boolean>();
  const serial = useRef(0);
  const drawing = useRef<HTMLDivElement>(null);
  const until = useRef(0);
  const request = useRef<AbortController | undefined>(undefined);
  const clear = () => {
    serial.current++;
    request.current?.abort();
    drawing.current?.querySelectorAll('canvas').forEach((canvas) => {
      canvas.width = 0;
      canvas.height = 0;
    });
    setUri(undefined);
    setInput('');
    setMatch(undefined);
    until.current = 0;
  };
  const close = () => {
    clear();
    props.onClose();
  };
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) close();
    };
    const blur = () => {
      if (until.current) close();
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', blur);
    return () => {
      serial.current++;
      request.current?.abort();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', blur);
    };
  }, []);
  useEffect(() => {
    if (!uri) return;
    const timer = setInterval(() => {
      const remaining = Math.ceil((until.current - performance.now()) / 1000);
      if (remaining <= 0 || document.hidden) close();
      else setSeconds(remaining);
    }, 200);
    return () => clearInterval(timer);
  }, [uri]);
  return (
    <Modal
      open
      title={t(uri ? 'entries.qrScan' : 'entries.transfer')}
      modalRender={(node) => (
        <div role="presentation" onKeyDownCapture={trapDialogTab}>
          {node}
        </div>
      )}
      closable={{ 'aria-label': t('entries.closeDialog') }}
      getContainer={false}
      className={styles.dialog}
      width={480}
      destroyOnHidden
      focusable={{ trap: true, focusTriggerAfterClose: true }}
      mask={{ closable: false }}
      onCancel={close}
      footer={null}
    >
      <p className={styles.help}>
        {props.info.issuer} · {props.info.accountName}
      </p>
      {uri ? (
        <>
          <div
            className={styles.qr}
            ref={drawing}
            role="img"
            aria-label={t('entries.qrLabel')}
          >
            <QRCode
              value={uri}
              type="canvas"
              size={240}
              marginSize={4}
              color="#000000"
              bgColor="#ffffff"
              bordered={false}
            />
          </div>
          <p className={styles.qrTimer} role="timer">
            {t('entries.qrCountdown', { seconds })}
          </p>
          <details className={styles.advanced}>
            <summary>{t('entries.compare')}</summary>
            <p className={styles.help}>{t('entries.compareHint')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Input
                className="min-w-0 flex-1"
                aria-label={t('entries.deviceCode')}
                inputMode="numeric"
                autoComplete="off"
                maxLength={props.info.digits}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setMatch(undefined);
                }}
              />
              <Button
                disabled={
                  busy || !new RegExp(`^\\d{${props.info.digits}}$`).test(input)
                }
                onClick={async () => {
                  const current = serial.current;
                  setBusy(true);
                  try {
                    const code = await props.onCode(props.itemId);
                    if (
                      current === serial.current &&
                      performance.now() < until.current &&
                      !document.hidden
                    ) {
                      setMatch(
                        Date.now() >= code.validFrom &&
                          Date.now() < code.validUntil &&
                          code.code === input,
                      );
                      setInput('');
                    }
                  } catch {
                    if (current === serial.current)
                      setError('entries.qrAuthFailed');
                  } finally {
                    if (current === serial.current) setBusy(false);
                  }
                }}
              >
                {t('entries.compareAction')}
              </Button>
            </div>
            {match !== undefined && (
              <p className={styles.help} role="status">
                {t(match ? 'entries.compareMatch' : 'vault.totpClock')}
              </p>
            )}
          </details>
          <p className={styles.help}>{t('entries.transferRevoke')}</p>
          <div className={styles.dialogActions}>
            <Button type="primary" autoFocus onClick={close}>
              {t('entries.done')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <ol className={styles.transferSteps}>
            <li>{t('entries.transferStep1')}</li>
            <li>{t('entries.transferStep2')}</li>
            <li>{t('entries.transferStep3')}</li>
          </ol>
          <p className={styles.warning}>{t('entries.transferWarning')}</p>
          <p className={styles.help}>{t('entries.transferHint')}</p>
          <div className={styles.dialogActions}>
            <Button onClick={close}>{t('vault.cancel')}</Button>
            <Button
              type="primary"
              loading={busy}
              onClick={async () => {
                const current = serial.current;
                setBusy(true);
                setError(undefined);
                try {
                  request.current = new AbortController();
                  const value = await props.onExport(
                    props.itemId,
                    request.current.signal,
                  );
                  if (current !== serial.current || document.hidden) return;
                  until.current = performance.now() + 60000;
                  setSeconds(60);
                  setUri(value);
                } catch (failure) {
                  if (current === serial.current)
                    setError(
                      failure instanceof Error &&
                        failure.message === 'VAULT_QR_TOO_LONG'
                        ? 'entries.qrTooLong'
                        : 'entries.qrAuthFailed',
                    );
                } finally {
                  if (current === serial.current) setBusy(false);
                }
              }}
            >
              {t('entries.authenticateQR')}
            </Button>
          </div>
        </>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {t(error)}
        </p>
      )}
    </Modal>
  );
}
