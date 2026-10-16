import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Alert, Button, Card, Space } from 'antd';
import React from 'react';

declare const VAULT_SITE_URL: string;

export default function PersonalVaultEntry() {
  const intl = useIntl();
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
      <Card className="max-w-2xl">
        <Space orientation="vertical" size="large">
          <p>
            {intl.formatMessage({
              id: 'vaultEntry.description',
              defaultMessage:
                '在独立站点登录并解锁，使用主密码与账户密钥管理个人密码。',
            })}
          </p>
          <Alert
            type="info"
            showIcon
            title={intl.formatMessage({
              id: 'vaultEntry.independent',
              defaultMessage:
                '密码库需要独立登录。请保管好账户密钥和恢复文件。',
            })}
          />
          <Button
            type="primary"
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
          {!target && (
            <Alert
              type="warning"
              title={intl.formatMessage({
                id: 'vaultEntry.configure',
                defaultMessage: '请先配置密码库独立站点的 HTTPS 地址。',
              })}
            />
          )}
        </Space>
      </Card>
    </PageContainer>
  );
}
