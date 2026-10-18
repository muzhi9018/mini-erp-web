import { Check, LockKeyhole } from 'lucide-react';
import type { ReactNode } from 'react';
import { useText } from './text';
import styles from './Vault.module.css';

export default function AuthShell({
  step,
  wide = false,
  children,
}: {
  step: number;
  wide?: boolean;
  children: ReactNode;
}) {
  const t = useText();
  const steps = [
    'vault.stepLogin',
    'vault.stepVerify',
    'vault.stepUnlock',
  ] as const;
  const hints = [
    'vault.stepLoginHint',
    'vault.stepVerifyHint',
    'vault.stepUnlockHint',
  ] as const;
  return (
    <div className={`${styles.auth} ${wide ? styles.authWide : ''}`}>
      <aside className={styles.authBrand}>
        <div className={styles.brandCopy}>
          <div className={styles.eyebrow}>YOUR PRIVATE SPACE</div>
          <h2>
            {t('vault.brandLine1')}
            <br />
            {t('vault.brandLine2')}
          </h2>
          <p>{t('vault.brandHint')}</p>
        </div>
        <ol className={styles.steps} aria-label={t('vault.progress')}>
          {steps.map((key, i) => (
            <li
              key={key}
              className={`${styles.step} ${i <= step ? styles.stepActive : ''}`}
              aria-current={i === step ? 'step' : undefined}
            >
              <span
                className={`${styles.stepNumber} ${i === step ? styles.currentStep : ''}`}
              >
                {i < step ? <Check size={16} strokeWidth={1.5} /> : i + 1}
              </span>
              <div>
                {t(key)}
                <small>{t(hints[i])}</small>
              </div>
            </li>
          ))}
        </ol>
      </aside>
      <section className={styles.authMain}>
        <div className={styles.authContent}>{children}</div>
      </section>
    </div>
  );
}

export function AuthTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={styles.authTitle}>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

export function AuthFoot({ children }: { children: ReactNode }) {
  return (
    <div className={styles.authFoot}>
      <LockKeyhole size={16} strokeWidth={1.5} />
      <span>{children}</span>
    </div>
  );
}
