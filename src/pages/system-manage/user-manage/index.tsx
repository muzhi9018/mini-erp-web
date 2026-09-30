import { CheckCircleFilled, InfoCircleOutlined } from '@ant-design/icons';
import {
  type ActionType,
  ModalForm,
  PageContainer,
  type ProColumns,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Modal, message, Popconfirm, Typography } from 'antd';
import { useRef, useState } from 'react';
import { Access, useAccess } from 'umi';
import { listAllRoles } from '@/services/user/role';
import {
  authorizeUserRole,
  createUser,
  findUsersByPage,
  resetUserPassword,
} from '@/services/user/user';
import { useStyles } from './index.style';

const UserManage = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { hasPermission } = useAccess();
  const actionRef = useRef<ActionType>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [authorizeUser, setAuthorizeUser] = useState<User.SysUser>();
  const [allRoles, setAllRoles] = useState<Role.RoleSummary[]>([]);
  const [loadingRolesFor, setLoadingRolesFor] = useState<string>();
  const [resetResult, setResetResult] = useState<{
    username: string;
    password: string;
  }>();
  const [messageApi, contextHolder] = message.useMessage();
  const handleResetPassword = async (user: User.SysUser) => {
    try {
      const password = await resetUserPassword(user.id);
      setResetResult({ username: user.username || user.id, password });
    } catch {
      // 请求错误已由全局处理器提示。
    }
  };
  const openAuthorize = async (user: User.SysUser) => {
    setLoadingRolesFor(user.id);
    try {
      const roles = await listAllRoles();
      setAllRoles(roles);
      setAuthorizeUser(user);
    } catch {
      // 请求错误已由全局处理器提示。
    } finally {
      setLoadingRolesFor(undefined);
    }
  };
  const authorizedRoleIds = new Set(
    authorizeUser?.roles?.map((role) => String(role.id)),
  );
  const roleOptions = allRoles.map((role) => ({
    label: role.roleCode
      ? `${role.roleName} (${role.roleCode})`
      : role.roleName,
    value: String(role.id),
    disabled: authorizedRoleIds.has(String(role.id)),
  }));
  const columns: ProColumns<User.SysUser>[] = [
    {
      title: intl.formatMessage({
        id: 'userManager.username',
        defaultMessage: '用户名',
      }),
      dataIndex: 'username',
    },
    {
      title: intl.formatMessage({
        id: 'userManager.userNo',
        defaultMessage: '用户编号',
      }),
      dataIndex: 'userNo',
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'userManager.realName',
        defaultMessage: '昵称',
      }),
      dataIndex: 'realName',
    },
    {
      title: intl.formatMessage({
        id: 'userManager.mobile',
        defaultMessage: '手机号',
      }),
      dataIndex: 'mobile',
    },
    {
      title: intl.formatMessage({
        id: 'userManager.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      valueEnum: {
        1: {
          text: intl.formatMessage({
            id: 'userManager.enabled',
            defaultMessage: '正常',
          }),
          status: 'Success',
        },
        0: {
          text: intl.formatMessage({
            id: 'userManager.disabled',
            defaultMessage: '禁用',
          }),
          status: 'Error',
        },
      },
    },
    {
      title: intl.formatMessage({
        id: 'userManager.roles',
        defaultMessage: '已授权角色',
      }),
      dataIndex: 'roles',
      search: false,
      renderText: (roles: User.SysUser['roles']) =>
        roles
          ?.map((role) => role.roleName)
          .filter(Boolean)
          .join(
            intl.formatMessage({
              id: 'userManager.roleSeparator',
              defaultMessage: '、',
            }),
          ) || '-',
    },
    {
      title: intl.formatMessage({
        id: 'userManager.remark',
        defaultMessage: '备注',
      }),
      dataIndex: 'remark',
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'userManager.createdAt',
        defaultMessage: '创建时间',
      }),
      dataIndex: 'gmtCreate',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'userManager.actions',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      render: (_, user) => [
        <Button
          key="authorize"
          type="primary"
          size="small"
          loading={loadingRolesFor === user.id}
          disabled={
            loadingRolesFor !== undefined && loadingRolesFor !== user.id
          }
          onClick={() => void openAuthorize(user)}
        >
          {intl.formatMessage({
            id: 'userManager.authorizeRole',
            defaultMessage: '授权角色',
          })}
        </Button>,
        <Access
          key="reset-password-access"
          accessible={hasPermission('system-manage:user-manage:reset-password')}
        >
          <Popconfirm
            title={intl.formatMessage({
              id: 'userManager.resetPasswordConfirmTitle',
              defaultMessage: '确定重置密码？',
            })}
            description={intl.formatMessage(
              {
                id: 'userManager.resetPasswordConfirmDescription',
                defaultMessage: '重置后 {username} 的原密码将立即失效。',
              },
              { username: user.username || user.id },
            )}
            onConfirm={() => handleResetPassword(user)}
            okText={intl.formatMessage({
              id: 'userManager.resetPassword',
              defaultMessage: '重置密码',
            })}
            cancelText={intl.formatMessage({
              id: 'userManager.cancel',
              defaultMessage: '取消',
            })}
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" size="small" danger>
              {intl.formatMessage({
                id: 'userManager.resetPassword',
                defaultMessage: '重置密码',
              })}
            </Button>
          </Popconfirm>
        </Access>,
      ],
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'userManager.title',
        defaultMessage: '用户管理',
      })}
    >
      {contextHolder}
      <ProTable<User.SysUser>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        headerTitle={intl.formatMessage({
          id: 'userManager.list',
          defaultMessage: '用户列表',
        })}
        toolBarRender={() => [
          <Access
            key="add-access"
            accessible={hasPermission('system-manage:user-manage:add')}
          >
            <Button
              key="create"
              type="primary"
              onClick={() => setCreateOpen(true)}
            >
              {intl.formatMessage({
                id: 'userManager.create',
                defaultMessage: '新增用户',
              })}
            </Button>
          </Access>,
        ]}
        request={async ({
          current = 1,
          pageSize = 15,
          username,
          realName,
          mobile,
          status,
        }) => {
          const page = await findUsersByPage({
            pageNum: current,
            pageSize,
            username,
            realName,
            mobile,
            status: status == null ? undefined : Number(status),
          });
          return { data: page.records, total: page.total, success: true };
        }}
        pagination={{ defaultPageSize: 15, showQuickJumper: true }}
        options={false}
      />
      <ModalForm<User.CreateSysUser>
        title={intl.formatMessage({
          id: 'userManager.create',
          defaultMessage: '新增用户',
        })}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{ status: 1 }}
        submitter={{
          searchConfig: {
            submitText: intl.formatMessage({
              id: 'userManager.create',
              defaultMessage: '新增用户',
            }),
            resetText: intl.formatMessage({
              id: 'userManager.cancel',
              defaultMessage: '取消',
            }),
          },
        }}
        onFinish={async (values) => {
          await createUser(values);
          setCreateOpen(false);
          messageApi.success(
            intl.formatMessage({
              id: 'userManager.createSuccess',
              defaultMessage: '用户创建成功',
            }),
          );
          void actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText
          name="username"
          label={intl.formatMessage({
            id: 'userManager.username',
            defaultMessage: '用户名',
          })}
          rules={[
            {
              required: true,
              whitespace: true,
              message: intl.formatMessage({
                id: 'userManager.usernameRequired',
                defaultMessage: '请输入用户名',
              }),
            },
          ]}
        />
        <ProFormText.Password
          name="password"
          label={intl.formatMessage({
            id: 'userManager.password',
            defaultMessage: '密码',
          })}
          rules={[
            {
              required: true,
              whitespace: true,
              message: intl.formatMessage({
                id: 'userManager.passwordRequired',
                defaultMessage: '请输入密码',
              }),
            },
          ]}
        />
        <ProFormText
          name="realName"
          label={intl.formatMessage({
            id: 'userManager.realName',
            defaultMessage: '昵称',
          })}
        />
        <ProFormText
          name="mobile"
          label={intl.formatMessage({
            id: 'userManager.mobile',
            defaultMessage: '手机号',
          })}
        />
        <ProFormRadio.Group
          name="status"
          label={intl.formatMessage({
            id: 'userManager.status',
            defaultMessage: '状态',
          })}
          options={[
            {
              label: intl.formatMessage({
                id: 'userManager.enabled',
                defaultMessage: '正常',
              }),
              value: 1,
            },
            {
              label: intl.formatMessage({
                id: 'userManager.disabled',
                defaultMessage: '禁用',
              }),
              value: 0,
            },
          ]}
        />
        <ProFormText
          name="remark"
          label={intl.formatMessage({
            id: 'userManager.remark',
            defaultMessage: '备注',
          })}
        />
      </ModalForm>
      {authorizeUser && (
        <ModalForm<Pick<User.AuthorizeRole, 'roleId'>>
          key={authorizeUser.id}
          title={intl.formatMessage(
            {
              id: 'userManager.authorizeRoleTitle',
              defaultMessage: '为 {username} 授权角色',
            },
            { username: authorizeUser.username || authorizeUser.id },
          )}
          open
          onOpenChange={(open) => {
            if (!open) setAuthorizeUser(undefined);
          }}
          submitter={{
            searchConfig: {
              submitText: intl.formatMessage({
                id: 'userManager.authorizeRole',
                defaultMessage: '授权角色',
              }),
              resetText: intl.formatMessage({
                id: 'userManager.cancel',
                defaultMessage: '取消',
              }),
            },
            submitButtonProps: {
              disabled: !roleOptions.some((option) => !option.disabled),
            },
          }}
          onFinish={async ({ roleId }) => {
            await authorizeUserRole({ userId: authorizeUser.id, roleId });
            setAuthorizeUser(undefined);
            messageApi.success(
              intl.formatMessage({
                id: 'userManager.authorizeSuccess',
                defaultMessage: '角色授权成功',
              }),
            );
            void actionRef.current?.reload();
            return true;
          }}
        >
          <ProFormSelect
            name="roleId"
            label={intl.formatMessage({
              id: 'userManager.selectRole',
              defaultMessage: '选择角色',
            })}
            placeholder={intl.formatMessage({
              id: 'userManager.selectRolePlaceholder',
              defaultMessage: '请选择角色',
            })}
            options={roleOptions}
            fieldProps={{
              showSearch: true,
              optionFilterProp: 'label',
              notFoundContent: intl.formatMessage({
                id: 'userManager.noRoles',
                defaultMessage: '暂无可用角色',
              }),
            }}
            extra={
              roleOptions.length > 0 &&
              roleOptions.every((option) => option.disabled)
                ? intl.formatMessage({
                    id: 'userManager.allRolesAuthorized',
                    defaultMessage: '所有角色均已授权',
                  })
                : intl.formatMessage({
                    id: 'userManager.authorizedRolesDisabled',
                    defaultMessage: '已授权的角色不可重复选择',
                  })
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'userManager.roleRequired',
                  defaultMessage: '请选择角色',
                }),
              },
            ]}
          />
        </ModalForm>
      )}
      {resetResult && (
        <Modal
          open
          centered
          width={440}
          title={
            <div className={styles.resetHeader}>
              <span className={styles.resetSuccessIcon} aria-hidden="true">
                <CheckCircleFilled />
              </span>
              <div>
                <h3 className={styles.resetTitle}>
                  {intl.formatMessage({
                    id: 'userManager.resetPasswordSuccess',
                    defaultMessage: '密码重置成功',
                  })}
                </h3>
                <p className={styles.resetSubtitle}>
                  {intl.formatMessage(
                    {
                      id: 'userManager.resetPasswordFor',
                      defaultMessage: '已为 {username} 生成新密码',
                    },
                    { username: resetResult.username },
                  )}
                </p>
              </div>
            </div>
          }
          onCancel={() => setResetResult(undefined)}
          footer={null}
        >
          <div className={styles.passwordPanel}>
            <span className={styles.passwordLabel}>
              {intl.formatMessage({
                id: 'userManager.newPassword',
                defaultMessage: '新密码',
              })}
            </span>
            <Typography.Paragraph
              className={styles.passwordValue}
              copyable={{
                text: resetResult.password,
                tooltips: [
                  intl.formatMessage({
                    id: 'userManager.copyPassword',
                    defaultMessage: '复制密码',
                  }),
                  intl.formatMessage({
                    id: 'userManager.passwordCopied',
                    defaultMessage: '密码已复制',
                  }),
                ],
              }}
            >
              {resetResult.password}
            </Typography.Paragraph>
          </div>
          <p className={styles.resetNotice}>
            <InfoCircleOutlined aria-hidden="true" />
            <span>
              {intl.formatMessage({
                id: 'userManager.savePasswordNotice',
                defaultMessage: '请立即复制并保存，关闭后将不再显示。',
              })}
            </span>
          </p>
          <Button
            type="primary"
            size="large"
            block
            onClick={() => setResetResult(undefined)}
          >
            {intl.formatMessage({
              id: 'userManager.close',
              defaultMessage: '关闭',
            })}
          </Button>
        </Modal>
      )}
    </PageContainer>
  );
};

export default UserManage;
