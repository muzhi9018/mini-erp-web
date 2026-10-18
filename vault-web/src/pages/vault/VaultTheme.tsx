import { App, ConfigProvider, theme } from 'antd';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';

const storageKey = 'vault-theme';
const ThemeContext = createContext<{ dark: boolean; toggle: () => void }>({
  dark: false,
  toggle: () => undefined,
});

export function useVaultTheme() {
  return useContext(ThemeContext);
}

export default function VaultTheme({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<'light' | 'dark' | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === 'light' || saved === 'dark' ? saved : null;
    } catch {
      return null;
    }
  });
  const [systemDark, setSystemDark] = useState(
    () => matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const dark = preference ? preference === 'dark' : systemDark;
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useLayoutEffect(() => {
    document.documentElement.dataset.vaultTheme = dark ? 'dark' : 'light';
    return () => {
      delete document.documentElement.dataset.vaultTheme;
    };
  }, [dark]);
  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    setPreference(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Keep the selection for this page when browser storage is unavailable.
    }
  };
  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <ConfigProvider
        theme={{
          algorithm: dark
            ? (seed, map) => ({
                ...theme.darkAlgorithm(seed, map),
                colorPrimary: '#91bbff',
                colorPrimaryHover: '#b0ceff',
                colorPrimaryActive: '#7daeff',
                colorLink: '#91bbff',
                colorLinkHover: '#b0ceff',
                colorLinkActive: '#7daeff',
              })
            : theme.defaultAlgorithm,
          token: {
            colorPrimary: dark ? '#91bbff' : '#2563eb',
            colorText: dark ? '#e3ecfb' : '#1e2f4b',
            colorTextSecondary: dark ? '#adbfdb' : '#60738e',
            colorBgContainer: dark ? '#19283f' : '#ffffff',
            colorBorder: dark ? '#334765' : '#dde6f4',
            colorPrimaryBg: dark ? '#213b63' : '#e8f0ff',
            borderRadius: 10,
            controlHeight: 42,
            fontFamily:
              '-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif',
          },
          components: {
            Button: { primaryColor: dark ? '#0f2b57' : '#ffffff' },
            Form: { labelColor: dark ? '#e3ecfb' : '#1e2f4b' },
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
