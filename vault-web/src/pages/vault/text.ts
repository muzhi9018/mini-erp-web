import { useIntl } from '@umijs/max';
import messages from '@/locales/en-US';

export type MessageKey = keyof typeof messages;
export function useText() {
  const intl = useIntl();
  return (key: MessageKey, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: key, defaultMessage: messages[key] }, values);
}
