import { useIntl } from '@umijs/max';
import { App, Form, Input, Modal } from 'antd';
import React, { useState } from 'react';
import { changePassword } from '@/services/user/user';

type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

type ChangePasswordFormValues = User.ChangePassword & {
  confirmPassword: string;
};

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  onClose,
}) => {
  const intl = useIntl();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: ChangePasswordFormValues) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await changePassword({
        oldPassword: values.oldPassword,
        password: values.password,
      });
      message.success(
        intl.formatMessage({
          id: 'component.globalHeader.changePassword.success',
          defaultMessage: '密码修改成功',
        }),
      );
      onClose();
    } catch {
      // The global request handler displays the error; keep the form for retrying.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({
        id: 'component.globalHeader.changePassword',
        defaultMessage: '修改密码',
      })}
      open={open}
      onCancel={onClose}
      okText={intl.formatMessage({
        id: 'component.globalHeader.changePassword.submit',
        defaultMessage: '确定',
      })}
      cancelText={intl.formatMessage({
        id: 'component.globalHeader.changePassword.cancel',
        defaultMessage: '取消',
      })}
      okButtonProps={{ htmlType: 'submit', form: 'change-password-form' }}
      confirmLoading={submitting}
      cancelButtonProps={{ disabled: submitting }}
      closable={!submitting}
      keyboard={!submitting}
      mask={{ closable: false }}
      destroyOnHidden
    >
      <Form<ChangePasswordFormValues>
        id="change-password-form"
        name="change-password"
        layout="vertical"
        onFinish={handleFinish}
        disabled={submitting}
        clearOnDestroy
      >
        <Form.Item
          name="oldPassword"
          label={intl.formatMessage({
            id: 'component.globalHeader.changePassword.oldPassword',
            defaultMessage: '原密码',
          })}
          rules={[
            {
              required: true,
              whitespace: true,
              message: intl.formatMessage({
                id: 'component.globalHeader.changePassword.oldPasswordRequired',
                defaultMessage: '请输入原密码',
              }),
            },
          ]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          name="password"
          label={intl.formatMessage({
            id: 'component.globalHeader.changePassword.password',
            defaultMessage: '新密码',
          })}
          rules={[
            {
              required: true,
              whitespace: true,
              message: intl.formatMessage({
                id: 'component.globalHeader.changePassword.passwordRequired',
                defaultMessage: '请输入新密码',
              }),
            },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={intl.formatMessage({
            id: 'component.globalHeader.changePassword.confirmPassword',
            defaultMessage: '确认新密码',
          })}
          dependencies={['password']}
          rules={[
            {
              required: true,
              whitespace: true,
              message: intl.formatMessage({
                id: 'component.globalHeader.changePassword.confirmPasswordRequired',
                defaultMessage: '请再次输入新密码',
              }),
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || value === getFieldValue('password')) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    intl.formatMessage({
                      id: 'component.globalHeader.changePassword.passwordMismatch',
                      defaultMessage: '两次输入的新密码不一致',
                    }),
                  ),
                );
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
