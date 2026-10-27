import {
  ArrowRightOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Helmet, SelectLang, useIntl, useModel } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Checkbox,
  ConfigProvider,
  Divider,
  Form,
  Input,
} from 'antd';
import { ThemeProvider } from 'antd-style';
import React, { startTransition, useRef, useState } from 'react';
import { Footer } from '@/components';
import { login } from '@/services/auth/auth';
import Settings from '../../../../config/defaultSettings';
import { loginFontFamily, useStyles } from './index.style';

const Login: React.FC = () => {
  const [loginError, setLoginError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles, theme } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      startTransition(() => {
        setInitialState((s) => ({ ...s, currentUser: userInfo }));
      });
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setLoginError(undefined);
    localStorage.clear();
    try {
      const user = await login({ ...values });
      if (user?.enabled) {
        localStorage.setItem(LOCAL_TOKEN, JSON.stringify(user));
        message.success(
          intl.formatMessage({
            id: 'pages.login.success',
            defaultMessage: '登录成功！',
          }),
        );
        await fetchUserInfo();
        window.location.href = '/welcome';
        return;
      }
      setLoginError(
        intl.formatMessage({
          id: 'pages.login.accountLogin.errorMessage',
          defaultMessage: '账户或密码错误',
        }),
      );
    } catch {
      const failureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: '登录失败，请重试！',
      });
      setLoginError(failureMessage);
      message.error(failureMessage);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const unavailable = intl.formatMessage({
    id: 'pages.login.unavailable',
    defaultMessage: '暂未接入',
  });

  return (
    <div className={`${styles.page} flex min-h-dvh flex-col`}>
      <Helmet>
        <title>
          {intl.formatMessage({ id: 'menu.login', defaultMessage: '登录页' })}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      <header className={styles.utilities}>
        <div className={styles.lang} data-lang>
          {SelectLang && <SelectLang />}
        </div>
      </header>
      <main
        className={`${styles.main} flex flex-1 items-center justify-center`}
      >
        <div className={styles.shell}>
          <section className={styles.hero} aria-labelledby="login-hero-title">
            <div className={styles.heroContent}>
              <p className={styles.eyebrow}>
                {intl.formatMessage({
                  id: 'pages.login.hero.eyebrow',
                  defaultMessage: '高效协同 · 从这里开始',
                })}
              </p>
              <div className={styles.rule} aria-hidden="true" />
              <h1 id="login-hero-title" className={styles.heroTitle}>
                {intl.formatMessage({
                  id: 'pages.login.hero.titleFirst',
                  defaultMessage: '业务有序，',
                })}
                <br />
                {intl.formatMessage({
                  id: 'pages.login.hero.titleSecond',
                  defaultMessage: '管理从容。',
                })}
              </h1>
              <p className={styles.description}>
                {intl.formatMessage({
                  id: 'pages.login.hero.descriptionFirst',
                  defaultMessage: '连接采购、库存、销售与财务，',
                })}
                <br />
                {intl.formatMessage({
                  id: 'pages.login.hero.descriptionSecond',
                  defaultMessage: '让每一天的工作更简单。',
                })}
              </p>
              <p className={styles.caption}>
                {intl.formatMessage({
                  id: 'pages.login.hero.caption',
                  defaultMessage: '一个入口，连接日常业务。',
                })}
              </p>
            </div>
          </section>
          <section
            className={`${styles.loginRegion} flex items-center justify-center`}
            aria-labelledby="login-title"
          >
            <ConfigProvider
              variant="outlined"
              theme={{
                token: {
                  fontFamily: loginFontFamily,
                  colorPrimary: theme.isDarkMode
                    ? theme.colorPrimary
                    : '#2563eb',
                  colorText: theme.isDarkMode ? theme.colorText : '#223754',
                  colorTextDescription: theme.isDarkMode
                    ? theme.colorTextDescription
                    : '#667c9a',
                  colorBorder: theme.isDarkMode ? theme.colorBorder : '#dce4ef',
                  colorError: theme.isDarkMode ? theme.colorError : '#c13838',
                  controlHeightLG: 48,
                  borderRadiusLG: 8,
                },
              }}
            >
              <div className={styles.card}>
                <h2 id="login-title" className={styles.title}>
                  {intl.formatMessage({
                    id: 'pages.login.title',
                    defaultMessage: '欢迎回来',
                  })}
                </h2>
                <p className={styles.intro}>
                  {intl.formatMessage({
                    id: 'pages.login.intro',
                    defaultMessage: '登录 MINI ERP，开始今天的工作。',
                  })}
                </p>
                <Form<API.LoginParams>
                  name="login"
                  className={styles.form}
                  layout="vertical"
                  requiredMark={false}
                  initialValues={{ autoLogin: true }}
                  scrollToFirstError={{ focus: true }}
                  onFinish={handleSubmit}
                >
                  {loginError && (
                    <Alert
                      className={styles.error}
                      title={loginError}
                      type="error"
                      showIcon
                      role="alert"
                    />
                  )}
                  <Form.Item
                    name="username"
                    label={intl.formatMessage({
                      id: 'pages.login.username.label',
                      defaultMessage: '账户',
                    })}
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({
                          id: 'pages.login.username.required',
                          defaultMessage: '请输入账户',
                        }),
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<UserOutlined />}
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder={intl.formatMessage({
                        id: 'pages.login.username.placeholder',
                        defaultMessage: '请输入账户',
                      })}
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label={intl.formatMessage({
                      id: 'pages.login.password.label',
                      defaultMessage: '密码',
                    })}
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({
                          id: 'pages.login.password.required',
                          defaultMessage: '请输入密码',
                        }),
                      },
                    ]}
                  >
                    <Input.Password
                      size="large"
                      prefix={<LockOutlined />}
                      autoComplete="current-password"
                      placeholder={intl.formatMessage({
                        id: 'pages.login.password.placeholder',
                        defaultMessage: '请输入密码',
                      })}
                    />
                  </Form.Item>
                  <div className={styles.formOptions}>
                    <Form.Item name="autoLogin" valuePropName="checked" noStyle>
                      <Checkbox>
                        {intl.formatMessage({
                          id: 'pages.login.rememberMe',
                          defaultMessage: '自动登录',
                        })}
                      </Checkbox>
                    </Form.Item>
                    <Button
                      type="link"
                      htmlType="button"
                      disabled
                      title={unavailable}
                    >
                      {intl.formatMessage({
                        id: 'pages.login.forgotPassword',
                        defaultMessage: '忘记密码？',
                      })}
                    </Button>
                  </div>
                  <Button
                    className={styles.submit}
                    type="primary"
                    size="large"
                    htmlType="submit"
                    block
                    loading={submitting}
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    {submitting
                      ? intl.formatMessage({
                          id: 'pages.login.submitting',
                          defaultMessage: '登录中…',
                        })
                      : intl.formatMessage({
                          id: 'pages.login.submit',
                          defaultMessage: '登录',
                        })}
                    {!submitting && <ArrowRightOutlined />}
                  </Button>
                </Form>
                <Divider plain className={styles.divider}>
                  {intl.formatMessage({
                    id: 'pages.login.loginWith',
                    defaultMessage: '其他登录方式',
                  })}
                </Divider>
                <div className={styles.providers}>
                  {(['alipay', 'taobao', 'weibo'] as const).map((provider) => (
                    <Button
                      key={provider}
                      type="text"
                      htmlType="button"
                      disabled
                      title={unavailable}
                    >
                      {intl.formatMessage({
                        id: `pages.login.provider.${provider}`,
                        defaultMessage: provider,
                      })}
                    </Button>
                  ))}
                </div>
              </div>
            </ConfigProvider>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const LoginPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');

  return (
    <ThemeProvider
      appearance={
        initialState?.settings?.navTheme === 'realDark' ? 'dark' : 'light'
      }
    >
      <Login />
    </ThemeProvider>
  );
};

export default LoginPage;
