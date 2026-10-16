import { useIntl } from '@umijs/max';
import messages from '@/locales/en-US/vault';

export type MessageKey = keyof typeof messages;
export function useText() {
  const intl = useIntl();
  return (key: MessageKey) =>
    intl.formatMessage({ id: key, defaultMessage: messages[key] });
}
