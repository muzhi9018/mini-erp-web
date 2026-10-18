import { useIntl } from '@umijs/max';
import messages from '@/locales/en-US';

export type MessageKey = keyof typeof messages;

export const passkeyErrorKeys: Partial<Record<string, MessageKey>> = {
  VAULT_PASSKEY_EXISTS: 'vault.passkeyExists',
  VAULT_PASSKEY_CANCELLED: 'vault.passkeyCancelled',
  VAULT_PASSKEY_UNSUPPORTED: 'vault.passkeyUnsupported',
  VAULT_PASSKEY_ORIGIN_INVALID: 'vault.passkeyOriginInvalid',
  VAULT_PASSKEY_INVALID: 'vault.passkeyInvalid',
  VAULT_CHALLENGE_INVALID: 'vault.passkeyExpired',
};

export function useText() {
  const intl = useIntl();
  return (key: MessageKey, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: key, defaultMessage: messages[key] }, values);
}
