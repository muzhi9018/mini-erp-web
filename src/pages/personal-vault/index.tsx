import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Alert, Button } from 'antd';
import {
  ArrowUpRight,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  UnlockKeyhole,
} from 'lucide-react';
import React from 'react';
import { useStyles } from './index.style';

declare const VAULT_SITE_URL: string;

export default function PersonalVaultEntry() {
  const intl = useIntl();
  const { styles } = useStyles();
  const title = intl.formatMessage({
    id: 'vaultEntry.title',
    defaultMessage: '个人密码库',
  });
  let target: URL | undefined;
  try {
    const url = new URL(VAULT_SITE_URL);
    if (
      url.protocol === 'https:' &&
      url.origin !== window.location.origin &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash
    )
      target = url;
  } catch {
    /* An invalid deployment URL keeps the entry disabled. */
  }
  return (
    <PageContainer title={title}>
      <div className={`${styles.page} mx-auto w-full`}>
        <section className={styles.panel} aria-labelledby="vault-entry-heading">
          <div
            className={`${styles.hero} grid items-center gap-8 lg:grid-cols-2`}
          >
            <div className={styles.copy}>
              <div className={`${styles.eyebrow} flex items-center gap-2`}>
                <ShieldCheck size={16} aria-hidden="true" />
                {intl.formatMessage({
                  id: 'vaultEntry.eyebrow',
                  defaultMessage: '专属于你的私密空间',
                })}
              </div>
              <h1 id="vault-entry-heading" className={styles.heading}>
                {intl.formatMessage({
                  id: 'vaultEntry.headline',
                  defaultMessage: '重要的密码，',
                })}
                <span>
                  {intl.formatMessage({
                    id: 'vaultEntry.headlineAccent',
                    defaultMessage: '值得妥善保管。',
                  })}
                </span>
              </h1>
              <p className={styles.description}>
                {intl.formatMessage({
                  id: 'vaultEntry.description',
                  defaultMessage:
                    '为你的账号与密码留一处私密空间。在独立站点完成身份验证，用主密码与账户密钥，在本地解锁。',
                })}
              </p>
              <Button
                className={styles.openButton}
                type="primary"
                size="large"
                icon={<ArrowUpRight size={18} aria-hidden="true" />}
                iconPlacement="end"
                href={target?.href}
                disabled={!target}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
              >
                {intl.formatMessage({
                  id: 'vaultEntry.open',
                  defaultMessage: '打开个人密码库',
                })}
              </Button>
              <p className={styles.linkHint}>
                {intl.formatMessage({
                  id: 'vaultEntry.newTab',
                  defaultMessage: '将在新标签页打开 · 需要独立登录',
                })}
              </p>
            </div>
            <div className={styles.artwork} aria-hidden="true">
              <div className={styles.orbit} />
              <div className={styles.orbitInner} />
              <div className={styles.vault}>
                <div className={styles.vaultDoor}>
                  <div className={styles.vaultLabel}>PERSONAL VAULT</div>
                  <div className={styles.lock}>
                    <LockKeyhole size={48} strokeWidth={1.5} />
                  </div>
                  <div className={styles.vaultDots}>
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className={styles.hingeTop} />
                <div className={styles.hingeBottom} />
              </div>
              <div className={`${styles.keyCard} flex items-center gap-3`}>
                <span className={styles.keyIcon}>
                  <KeyRound size={21} />
                </span>
                <span className="flex flex-col gap-2">
                  <span className={styles.cardLine} />
                  <span className={styles.passwordDots}>
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                </span>
                <LockKeyhole size={14} className={styles.cardLock} />
              </div>
              <div className={styles.shieldBadge}>
                <ShieldCheck size={29} strokeWidth={1.6} />
              </div>
              <span className={styles.sparkOne} />
              <span className={styles.sparkTwo} />
            </div>
          </div>
          <ol className={`${styles.steps} grid gap-7 md:grid-cols-3`}>
            {[
              {
                key: 'login',
                icon: LogIn,
                title: '独立登录',
                description: '使用系统账号，登录密码库独立站点。',
              },
              {
                key: 'verify',
                icon: Fingerprint,
                title: '验证身份',
                description: '通过 Passkey，确认是你本人操作。',
              },
              {
                key: 'unlock',
                icon: UnlockKeyhole,
                title: '本地解锁',
                description: '使用主密码与账户密钥，解锁你的密码。',
              },
            ].map((step, index) => (
              <li key={step.key} className="flex items-start gap-4">
                <span className={styles.stepIcon}>
                  <step.icon size={21} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className={styles.stepTitle}>
                    <span className={styles.stepNumber}>0{index + 1}</span>
                    {intl.formatMessage({
                      id: `vaultEntry.${step.key}.title`,
                      defaultMessage: step.title,
                    })}
                  </h2>
                  <p className={styles.stepDescription}>
                    {intl.formatMessage({
                      id: `vaultEntry.${step.key}.description`,
                      defaultMessage: step.description,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <aside className={`${styles.notice} flex items-start gap-3`}>
          <KeyRound size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className={styles.noticeTitle}>
              {intl.formatMessage({
                id: 'vaultEntry.reminder',
                defaultMessage: '进入之前，请记得',
              })}
            </h2>
            <p className={styles.noticeDescription}>
              {intl.formatMessage({
                id: 'vaultEntry.independent',
                defaultMessage:
                  '请妥善保管账户密钥和恢复文件，并将它们分开离线保存。',
              })}
            </p>
          </div>
        </aside>
        {!target && (
          <Alert
            type="warning"
            showIcon
            title={intl.formatMessage({
              id: 'vaultEntry.configure',
              defaultMessage: '请先配置密码库独立站点的 HTTPS 地址。',
            })}
          />
        )}
      </div>
    </PageContainer>
  );
}
