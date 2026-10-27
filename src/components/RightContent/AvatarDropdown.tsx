import {
  LockOutlined,
  LogoutOutlined,
  SettingOutlined,
  SkinOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { history, useIntl, useModel } from '@umijs/max';
import type { MenuProps } from 'antd';
import { App, Spin } from 'antd';
import React, { startTransition, useState } from 'react';
import { logout } from '@/services/auth/auth';
import { changeCurrentRole } from '@/services/user/user';
import HeaderDropdown from '../HeaderDropdown';
import ChangePasswordModal from './ChangePasswordModal';

type GlobalHeaderRightProps = {
  children?: React.ReactNode;
};

const loginOut = async () => {
  try {
    await logout();
  } catch {
    // Local logout has already cleared user state; redirect should still proceed.
  }
  localStorage.removeItem(LOCAL_TOKEN);
  const { search, pathname } = window.location;
  const searchParams = new URLSearchParams({
    redirect: pathname + search,
  });
  if (pathname !== '/user/login') {
    history.replace({
      pathname: '/user/login',
      search: searchParams.toString(),
    });
  }
};

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({
  children,
}) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const intl = useIntl();
  const { modal, message } = App.useApp();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  if (!initialState?.currentUser) {
    return <Spin size="small" />;
  }

  const { currentUser } = initialState;
  const roles = (currentUser.roles ?? []).filter((role) => role.roleCode);

  const logout = async () => {
    startTransition(() => {
      setInitialState((s) => ({ ...s, currentUser: undefined }));
    });
    await loginOut();
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'switchRole',
      icon: <SwapOutlined />,
      label: intl.formatMessage({
        id: 'component.globalHeader.switchRole',
        defaultMessage: '切换角色',
      }),
      disabled: roles.length === 0,
      children: roles.map((role) => ({
        key: `role:${role.roleCode}`,
        label: role.roleName || role.roleCode,
        disabled: role.roleCode === currentUser.roleCode,
      })),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: intl.formatMessage({
        id: 'menu.account.settings',
        defaultMessage: '个人设置',
      }),
    },
    {
      key: 'changePassword',
      icon: <LockOutlined />,
      label: intl.formatMessage({
        id: 'component.globalHeader.changePassword',
        defaultMessage: '修改密码',
      }),
    },
    {
      key: 'theme',
      icon: <SkinOutlined />,
      label: intl.formatMessage({
        id: 'component.globalHeader.themeSettings',
        defaultMessage: '主题设置',
      }),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: intl.formatMessage({
        id: 'menu.account.logout',
        defaultMessage: '退出登录',
      }),
    },
  ];

  const onMenuClick: MenuProps['onClick'] = async (event) => {
    const { key } = event;
    if (key.startsWith('role:')) {
      const role = roles.find((item) => `role:${item.roleCode}` === key);
      if (!role?.roleCode || role.roleCode === currentUser.roleCode) {
        return;
      }
      const roleCode = role.roleCode;
      await modal.confirm({
        title: intl.formatMessage({
          id: 'component.globalHeader.switchRole',
          defaultMessage: '切换角色',
        }),
        content: intl.formatMessage(
          {
            id: 'component.globalHeader.switchRole.confirm',
            defaultMessage:
              '切换为“{roleName}”需要退出并重新登录后才会生效，是否确定？',
          },
          { roleName: role.roleName || roleCode },
        ),
        okText: intl.formatMessage({
          id: 'component.globalHeader.switchRole.ok',
          defaultMessage: '确定',
        }),
        cancelText: intl.formatMessage({
          id: 'component.globalHeader.switchRole.cancel',
          defaultMessage: '取消',
        }),
        onOk: async () => {
          try {
            await changeCurrentRole(roleCode);
          } catch (error) {
            message.error(
              intl.formatMessage({
                id: 'component.globalHeader.switchRole.failed',
                defaultMessage: '切换角色失败，请重试',
              }),
            );
            throw error;
          }
          await logout();
        },
      });
      return;
    }
    if (key === 'logout') {
      void logout();
      return;
    }
    if (key === 'theme') {
      setInitialState((s) => ({ ...s, settingDrawerOpen: true }));
      return;
    }
    if (key === 'changePassword') {
      setChangePasswordOpen(true);
      return;
    }
    history.push(`/account/${key}`);
  };

  return (
    <>
      <HeaderDropdown
        placement="bottomRight"
        menu={{
          selectedKeys: [],
          triggerSubMenuAction: 'click',
          onClick: onMenuClick,
          items: menuItems,
        }}
        arrow
      >
        {children}
      </HeaderDropdown>
      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  );
};
