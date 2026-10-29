import { PlusOutlined } from '@ant-design/icons';
import {
  type ActionType,
  ModalForm,
  PageContainer,
  type ProColumns,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Access, useAccess, useIntl } from '@umijs/max';
import { Button, message, Popconfirm } from 'antd';
import { useRef, useState } from 'react';
import {
  createSite,
  deleteSite,
  editSite,
  listSites,
} from '@/services/vault/site';

const VaultSite = () => {
  const intl = useIntl();
  const { hasPermission } = useAccess();
  const actionRef = useRef<ActionType>(undefined);
  const [messageApi, contextHolder] = message.useMessage();
  const [createOpen, setCreateOpen] = useState(false);
  const nameRules = [
    {
      required: true,
      whitespace: true,
      message: intl.formatMessage({
        id: 'vaultSite.nameRequired',
        defaultMessage: '请输入站点名称',
      }),
    },
  ];
  const domainRules = [
    {
      required: true,
      whitespace: true,
      message: intl.formatMessage({
        id: 'vaultSite.domainRequired',
        defaultMessage: '请输入站点域名',
      }),
    },
  ];
  const statusRules = [
    {
      required: true,
      message: intl.formatMessage({
        id: 'vaultSite.statusRequired',
        defaultMessage: '请选择状态',
      }),
    },
  ];
  const statusOptions = [
    {
      label: intl.formatMessage({
        id: 'vaultSite.enabled',
        defaultMessage: '正常',
      }),
      value: 1,
    },
    {
      label: intl.formatMessage({
        id: 'vaultSite.disabled',
        defaultMessage: '禁用',
      }),
      value: 0,
    },
  ];
  const columns: ProColumns<Vault.Site>[] = [
    {
      title: intl.formatMessage({
        id: 'vaultSite.id',
        defaultMessage: '站点 ID',
      }),
      dataIndex: 'id',
      editable: false,
      search: false,
      width: 180,
    },
    {
      title: intl.formatMessage({
        id: 'vaultSite.siteName',
        defaultMessage: '站点名称',
      }),
      dataIndex: 'siteName',
      ellipsis: true,
      fieldProps: { maxLength: 128 },
      formItemProps: (_form, { isEditable }) => ({
        rules: isEditable ? nameRules : [],
      }),
    },
    {
      title: intl.formatMessage({
        id: 'vaultSite.siteDomain',
        defaultMessage: '站点域名',
      }),
      dataIndex: 'siteDomain',
      ellipsis: true,
      fieldProps: { maxLength: 256 },
      formItemProps: (_form, { isEditable }) => ({
        rules: isEditable ? domainRules : [],
      }),
    },
    {
      title: intl.formatMessage({
        id: 'vaultSite.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      valueType: 'select',
      width: 100,
      valueEnum: {
        1: { text: statusOptions[0].label, status: 'Success' },
        0: { text: statusOptions[1].label, status: 'Default' },
      },
      fieldProps: (_form, { isEditable }) => ({
        options: statusOptions,
        allowClear: !isEditable,
      }),
      formItemProps: (_form, { isEditable }) => ({
        rules: isEditable ? statusRules : [],
      }),
    },
    {
      title: intl.formatMessage({
        id: 'vaultSite.sort',
        defaultMessage: '排序',
      }),
      dataIndex: 'sort',
      valueType: 'digit',
      fieldProps: { min: -2147483648, max: 2147483647, precision: 0 },
      search: false,
      width: 100,
    },
    {
      title: intl.formatMessage({
        id: 'vaultSite.updatedAt',
        defaultMessage: '更新时间',
      }),
      dataIndex: 'gmtModified',
      editable: false,
      valueType: 'dateTime',
      search: false,
      width: 180,
    },
    {
      title: intl.formatMessage({
        id: 'vaultSite.actions',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      width: 140,
      render: (_, site) => [
        <Access key="edit" accessible={hasPermission('vault:vault-site:edit')}>
          <Button
            type="link"
            onClick={() => actionRef.current?.startEditable?.(site.id)}
          >
            {intl.formatMessage({
              id: 'vaultSite.edit',
              defaultMessage: '编辑',
            })}
          </Button>
        </Access>,
        <Access
          key="delete"
          accessible={hasPermission('vault:vault-site:delete')}
        >
          <Popconfirm
            title={intl.formatMessage({
              id: 'vaultSite.deleteTitle',
              defaultMessage: '删除站点',
            })}
            description={intl.formatMessage(
              {
                id: 'vaultSite.deleteConfirm',
                defaultMessage: '确定删除站点“{name}”吗？',
              },
              { name: site.siteName },
            )}
            okText={intl.formatMessage({
              id: 'vaultSite.confirm',
              defaultMessage: '确定',
            })}
            cancelText={intl.formatMessage({
              id: 'vaultSite.cancel',
              defaultMessage: '取消',
            })}
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              try {
                await deleteSite(site.id);
              } catch {
                // 请求错误由全局处理器提示，失败时保留列表。
                return;
              }
              messageApi.success(
                intl.formatMessage({
                  id: 'vaultSite.deleteSuccess',
                  defaultMessage: '站点删除成功',
                }),
              );
              void actionRef.current?.reload(true);
            }}
          >
            <Button type="link" danger>
              {intl.formatMessage({
                id: 'vaultSite.delete',
                defaultMessage: '删除',
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
        id: 'vaultSite.title',
        defaultMessage: '密码库站点配置',
      })}
    >
      {contextHolder}
      <ProTable<Vault.Site, Vault.SiteListParams>
        actionRef={actionRef}
        editable={{
          type: 'single',
          saveText: intl.formatMessage({
            id: 'vaultSite.save',
            defaultMessage: '保存',
          }),
          cancelText: intl.formatMessage({
            id: 'vaultSite.cancel',
            defaultMessage: '取消',
          }),
          actionRender: (_row, _config, defaultDom) => [
            defaultDom.save,
            defaultDom.cancel,
          ],
          onSave: async (_key, site) => {
            await editSite({
              id: site.id,
              siteName: site.siteName.trim(),
              siteDomain: site.siteDomain.trim(),
              status: site.status,
              sort: site.sort ?? undefined,
            });
            messageApi.success(
              intl.formatMessage({
                id: 'vaultSite.editSuccess',
                defaultMessage: '站点更新成功',
              }),
            );
            void actionRef.current?.reload();
          },
        }}
        rowKey="id"
        columns={columns}
        headerTitle={intl.formatMessage({
          id: 'vaultSite.list',
          defaultMessage: '站点列表',
        })}
        toolBarRender={() => [
          <Access
            key="create"
            accessible={hasPermission('vault:vault-site:create')}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              {intl.formatMessage({
                id: 'vaultSite.create',
                defaultMessage: '新增站点',
              })}
            </Button>
          </Access>,
        ]}
        request={async ({
          current = 1,
          pageSize = 15,
          siteName,
          siteDomain,
          status,
        }) => {
          const page = await listSites({
            pageNum: current,
            pageSize,
            siteName: siteName?.trim() || undefined,
            siteDomain: siteDomain?.trim() || undefined,
            status:
              status == null ? undefined : (Number(status) as Vault.SiteStatus),
          });
          return { data: page.records, total: page.total, success: true };
        }}
        pagination={{ defaultPageSize: 15, showQuickJumper: true }}
        search={{ defaultCollapsed: false }}
        options={false}
        scroll={{ x: 1100 }}
      />
      {createOpen && (
        <ModalForm<Vault.SiteValues>
          name="vaultSiteForm"
          title={intl.formatMessage({
            id: 'vaultSite.create',
            defaultMessage: '新增站点',
          })}
          open
          onOpenChange={setCreateOpen}
          width={520}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{ status: 1, sort: 0 }}
          submitter={{
            searchConfig: {
              submitText: intl.formatMessage({
                id: 'vaultSite.save',
                defaultMessage: '保存',
              }),
              resetText: intl.formatMessage({
                id: 'vaultSite.cancel',
                defaultMessage: '取消',
              }),
            },
          }}
          onFinish={async (values) => {
            const data: Vault.SiteValues = {
              siteName: values.siteName.trim(),
              siteDomain: values.siteDomain.trim(),
              status: values.status,
              sort: values.sort ?? undefined,
            };
            try {
              await createSite(data);
            } catch {
              // 保留表单供重试，错误提示由全局请求处理器负责。
              return false;
            }
            messageApi.success(
              intl.formatMessage({
                id: 'vaultSite.createSuccess',
                defaultMessage: '站点创建成功',
              }),
            );
            void actionRef.current?.reload(true);
            return true;
          }}
        >
          <ProFormText
            name="siteName"
            label={intl.formatMessage({
              id: 'vaultSite.siteName',
              defaultMessage: '站点名称',
            })}
            fieldProps={{ maxLength: 128, showCount: true }}
            rules={nameRules}
          />
          <ProFormText
            name="siteDomain"
            label={intl.formatMessage({
              id: 'vaultSite.siteDomain',
              defaultMessage: '站点域名',
            })}
            fieldProps={{ maxLength: 256, showCount: true }}
            rules={domainRules}
          />
          <ProFormSelect
            name="status"
            label={intl.formatMessage({
              id: 'vaultSite.status',
              defaultMessage: '状态',
            })}
            options={statusOptions}
            fieldProps={{ allowClear: false }}
            rules={statusRules}
          />
          <ProFormDigit
            name="sort"
            label={intl.formatMessage({
              id: 'vaultSite.sort',
              defaultMessage: '排序',
            })}
            min={-2147483648}
            max={2147483647}
            fieldProps={{ precision: 0 }}
          />
        </ModalForm>
      )}
    </PageContainer>
  );
};

export default VaultSite;
