import './index.less';
import {
  ModalForm,
  PageContainer,
  type ProColumns,
  ProForm,
  ProFormDigit,
  ProFormRadio,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Drawer, Popconfirm, Tag } from 'antd';
import React, { useState } from 'react';
import { Access, useAccess } from 'umi';
import {
  addRole,
  delRole,
  editRole,
  findByPage,
  roleAuthorize,
  roleMenuDetail,
} from '@/services/user/role';

const RoleManage: React.FC = () => {
  const { hasPermission } = useAccess();
  const [loading, setLoading] = useState<boolean>(false);
  const [formRole, setFormRole] = useState<Role.Role>({});
  const [openRoleForm, handleRoleForm] = useState<boolean>(false);
  const [list, setList] = useState<Role.Role[]>([]);
  const [queryCache, setQueryCache] = useState<Role.RoleQuery>({
    current: 1,
    pageSize: 15,
    total: 0,
  });
  const [isOpenAuthorize, setOpenAuthorize] = useState<boolean>(false);
  const [menuTree, setMenuTree] = useState<System.MenuVO[]>([]);
  const [menuList, setMenuList] = useState<System.MenuVO[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [authorizeFrom] = ProForm.useForm<Role.Role>();

  /**
   * 加载角色列表
   * @param params
   */
  const loadListData = async (params: any) => {
    setLoading(true);
    const query: Role.RoleQuery = { ...params };
    const pageInfo = await findByPage(query, {}).finally(() =>
      setLoading(false),
    );
    setQueryCache({ ...query, total: pageInfo.total });
    setList(pageInfo.records);
    return { data: pageInfo.records, total: pageInfo.total };
  };

  /**
   * 重置新增角色表单
   */
  const resetRoleForm = () => {
    handleRoleForm(false);
    setFormRole({});
  };

  /**
   * 保存角色
   * @param data 保存对象
   */
  const saveRole = async (data: Role.Role) => {
    setLoading(true);
    if (data.id) {
      await editRole(data, {});
    } else {
      await addRole(data, {});
    }
    setLoading(false);
    resetRoleForm();
    // 刷新表单数据
    await loadListData(queryCache);
  };

  /**
   * 删除角色
   * @param data
   */
  const deleteHandler = async (data: Role.Role) => {
    await delRole(data);
    // 刷新表单数据
    await loadListData(queryCache);
  };

  /**
   * 编辑角色处理
   * @param data
   */
  const editHandler = (data: Role.Role) => {
    setFormRole(data);
    handleRoleForm(true);
  };

  /**
   * 树拆解成 list
   * @param treeList
   * @param list
   * @param selectedIds
   */
  const treeReductionList = async (
    treeList: System.MenuVO[],
    list: System.MenuVO[],
    selectedIds: string[],
  ) => {
    for (const item of treeList) {
      if (item.selected) {
        selectedIds.push(item.id ?? '');
      }
      const children = item.children ?? [];
      await treeReductionList(children, list, selectedIds);
      const menu: System.MenuVO = { ...item, children: [] };
      list.push(menu);
    }
  };

  /**
   * 授权处理
   * @param data
   */
  const authorizeHandle = async (data: Role.Role) => {
    setLoading(true);
    const menuTree = await roleMenuDetail({ id: data.id }, {});
    if (!menuTree) {
      return;
    }
    setMenuTree(menuTree);
    const list: System.MenuVO[] = [];
    const selectedIds: string[] = [];
    await treeReductionList(menuTree, list, selectedIds);
    authorizeFrom.setFieldsValue(data);
    setMenuList(list);
    setSelectedMenuIds(selectedIds);
    setOpenAuthorize(true);
    setLoading(false);
  };

  /**
   * 设置选中 id 处理使用 Set 去重
   * @param menuIds
   */
  const setSelectedMenuIdsHandler = (menuIds: Set<string>) => {
    setSelectedMenuIds(Array.from(menuIds));
  };

  /**
   * 关闭授权窗口
   */
  const closeAuthorizeDrawer = () => {
    setOpenAuthorize(false);
    authorizeFrom.setFieldsValue({});
    setMenuTree([]);
    setMenuList([]);
    setSelectedMenuIdsHandler(new Set<string>());
  };

  /**
   * 查找所有父id
   * @param currentMenuIds
   * @param menuIds
   */
  const findAllMenuParentIds = (
    currentMenuIds: string[],
    menuIds: Set<string>,
  ) => {
    const parentMenuIds: string[] = [];
    for (const currentMenuId of currentMenuIds) {
      for (const item of menuList) {
        if (item.id === currentMenuId) {
          menuIds.add(item.id);
          if (item.parentId && item.parentId !== '0') {
            parentMenuIds.push(item.parentId);
          }
        }
      }
    }
    if (parentMenuIds.length > 0) {
      findAllMenuParentIds(parentMenuIds, menuIds);
    }
  };

  /**
   * 查询所有子节点ids
   * @param menus
   * @param menuIds
   */
  const findAllMenuChildrenIds = (
    menus: System.MenuVO[],
    menuIds: Set<string>,
  ) => {
    for (const menu of menus) {
      menuIds.add(menu.id ?? '');
      findAllMenuChildrenIds(menu.children ?? [], menuIds);
    }
  };

  /**
   * 菜单选中状态
   * @param record
   * @param selected
   */
  const menuOnSelect = (record: System.MenuVO, selected: boolean) => {
    const operateIds = new Set<string>();
    operateIds.add(record.id ?? '');
    findAllMenuChildrenIds(record.children ?? [], operateIds);
    const selectedIds = new Set<string>(selectedMenuIds);
    if (selected) {
      // 选中要级联选中父级
      if (record.parentId && record.parentId !== '0') {
        findAllMenuParentIds([record.parentId], operateIds);
      }
      setSelectedMenuIdsHandler(
        new Set<string>([...selectedIds, ...operateIds]),
      );
    } else {
      operateIds.forEach((item) => {
        selectedIds.delete(item);
      });
      setSelectedMenuIdsHandler(selectedIds);
    }
  };

  /**
   * 菜单所有选中，取消选中回调函数
   * @param selected
   * @param selectedRows
   */
  const menuOnSelectAll = (
    selected: boolean,
    selectedRows: System.MenuVO[],
  ) => {
    if (selected) {
      const selectedIds: string[] = [];
      for (const item of selectedRows) {
        if (item.id) {
          selectedIds.push(item.id);
        }
      }
      setSelectedMenuIdsHandler(new Set<string>(selectedIds));
    } else {
      setSelectedMenuIdsHandler(new Set<string>());
    }
  };

  /**
   * 使用 shift 多选回调
   * @param selected
   * @param selectedRows
   */
  const menuOnSelectMultiple = (
    selected: boolean,
    selectedRows: System.MenuVO[],
  ) => {
    const operateIds = new Set<string>();
    for (const menu of selectedRows) {
      operateIds.add(menu.id ?? '');
      findAllMenuChildrenIds(menu.children ?? [], operateIds);
      if (selected && menu.parentId && menu.parentId !== '0') {
        findAllMenuParentIds([menu.parentId], operateIds);
      }
    }
    const selectedIds = new Set<string>(selectedMenuIds);
    if (selected) {
      setSelectedMenuIdsHandler(
        new Set<string>([...selectedIds, ...operateIds]),
      );
    } else {
      operateIds.forEach((item) => {
        selectedIds.delete(item);
      });
      setSelectedMenuIdsHandler(selectedIds);
    }
  };

  /**
   * 提交授权
   */
  const submitAuthorize = async () => {
    const data = authorizeFrom.getFieldsValue();
    data.menuIds = selectedMenuIds;
    await roleAuthorize(data, {});
    closeAuthorizeDrawer();
  };

  /**
   * 角色列表 Columns
   */
  const roleColumns: ProColumns<Role.Role>[] = [
    {
      title: '角色名称',
      width: 200,
      dataIndex: 'roleName',
    },
    {
      title: '角色编码',
      width: 200,
      dataIndex: 'roleCode',
      render: (text) => <Tag color={'blue'}>{text}</Tag>,
    },
    {
      title: '状态',
      width: 80,
      dataIndex: 'status',
      valueEnum: {
        1: { text: '正常', status: 'Success' },
        0: { text: '禁用', status: 'Error' },
      },
    },
    {
      title: '备注',
      width: 150,
      dataIndex: 'remark',
    },
    {
      title: '创建时间',
      tooltip: '创建实际',
      width: 140,
      key: 'since',
      dataIndex: 'gmtCreate',
      valueType: 'dateTime',
      // sorter: (a, b) => a.createdAt - b.createdAt,
    },
    {
      title: '操作',
      width: 200,
      valueType: 'option',
      key: 'option',
      render: (_, record) => {
        return [
          <Access
            key="access-authorize"
            accessible={hasPermission('system-manage:role-manage:authorize')}
          >
            <Button
              key="authorize"
              type="primary"
              size="small"
              onClick={() => authorizeHandle(record)}
            >
              授权
            </Button>
          </Access>,
          <Access
            key="access-edit"
            accessible={hasPermission('system-manage:role-manage:edit')}
          >
            <Button
              key="edit"
              type="primary"
              size="small"
              onClick={() => editHandler(record)}
            >
              编辑
            </Button>
          </Access>,
          <Access
            key="access-delet"
            accessible={hasPermission('system-manage:role-manage:del')}
          >
            <Popconfirm
              key="delete-comfirm"
              title="您确定要删除当前角色吗？"
              okButtonProps={{
                style: {
                  background: 'red',
                  color: 'white',
                },
              }}
              onConfirm={() => deleteHandler(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button key="delet" type="primary" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          </Access>,
        ];
      },
    },
  ];

  /**
   * 角色授权菜单列表 Columns
   */
  const menuColumns: ProColumns<System.MenuVO>[] = [
    {
      title: '名称',
      width: 120,
      dataIndex: 'name',
    },
    {
      title: '类型',
      width: 120,
      align: 'right',
      dataIndex: 'type',
      search: false,
      valueEnum: { 1: '目录', 2: '菜单', 3: '按钮', 4: '接口' },
      editable: false,
      render: (_) => <Tag color={'green'}>{_}</Tag>,
    },
    {
      title: '权限码',
      width: 120,
      dataIndex: 'permissionCode',
      search: false,
      render: (_) => <Tag color={'blue'}>{_}</Tag>,
    },
    {
      title: '所属客户端',
      width: 250,
      dataIndex: 'clientId',
      editable: false,
    },
  ];

  return (
    <PageContainer>
      <ProTable<Role.Role>
        columns={roleColumns}
        dataSource={list}
        request={(params) => {
          return loadListData(params);
        }}
        rowKey="id"
        pagination={{
          showQuickJumper: true,
          defaultCurrent: queryCache.current,
          defaultPageSize: queryCache.pageSize,
          total: queryCache.total,
        }}
        search={{}}
        loading={loading}
        dateFormatter="string"
        headerTitle="角色列表"
        options={false}
        toolBarRender={() => [
          <Access
            key="access-add"
            accessible={hasPermission('system-manage:role-manage:add')}
          >
            <Button
              type="primary"
              key="primary"
              onClick={() => {
                setFormRole({});
                handleRoleForm(true);
              }}
            >
              新增角色
            </Button>
          </Access>,
        ]}
      ></ProTable>
      {/* 新增角色 */}
      <ModalForm<Role.Role>
        loading={loading}
        initialValues={formRole}
        title={formRole.id ? '编辑角色' : '新增角色'}
        width="490px"
        modalProps={{
          destroyOnHidden: true,
        }}
        open={openRoleForm}
        onOpenChange={handleRoleForm}
        onReset={async () => resetRoleForm()}
        onFinish={async (value) => saveRole(value)}
        submitter={{
          render: (props, dom) => {
            return [
              <Button
                htmlType="button"
                onClick={() => {
                  props.reset();
                  handleRoleForm(false);
                }}
                key="edit"
              >
                取消
              </Button>,
              dom[1],
            ];
          },
        }}
      >
        <ProFormText width="lg" name="id" label="id" hidden={true} />
        <ProFormText
          width="lg"
          name="roleName"
          label="角色名称"
          placeholder="请输入角色名称"
          disabled={formRole.sysDefRole}
          rules={[
            {
              required: true,
              message: '请输入角色名称',
            },
          ]}
        />
        <ProFormText
          width="lg"
          name="roleCode"
          label="角色编码"
          disabled={!!formRole.id}
          rules={[
            {
              required: true,
              message: '请输入角色编码',
            },
          ]}
        />
        <ProFormText width="lg" name="remark" label="备注" />
        <ProFormDigit
          label="排序"
          name="sort"
          min={0}
          fieldProps={{ precision: 0 }}
        />
        <ProFormRadio.Group
          name="type"
          label="状态"
          initialValue={1}
          rules={[
            {
              required: true,
              message: '请选择状态',
            },
          ]}
          options={[
            {
              label: '正常',
              value: 1,
            },
            {
              label: '禁用',
              value: 0,
            },
          ]}
        />
      </ModalForm>
      <Drawer
        className="authorize-drawer"
        title="角色授权"
        size={'45%'}
        placement="right"
        onClose={() => closeAuthorizeDrawer()}
        open={isOpenAuthorize}
      >
        <ProTable<System.MenuVO>
          rowKey="id"
          columns={menuColumns}
          dataSource={menuTree}
          pagination={false}
          search={false}
          expandable={{
            defaultExpandAllRows: true,
          }}
          rowSelection={{
            selectedRowKeys: selectedMenuIds,
            type: 'checkbox',
            // onChange: menuSelectChangeHandler,
            onSelect: menuOnSelect,
            onSelectAll: menuOnSelectAll,
            onSelectMultiple: menuOnSelectMultiple,
          }}
          dateFormatter="string"
          headerTitle={
            <ProForm
              form={authorizeFrom}
              layout={'inline'}
              submitter={{
                render: () => {
                  return [
                    <Button
                      key="submitAuthorize"
                      type="primary"
                      onClick={submitAuthorize}
                    >
                      提交授权
                    </Button>,
                  ];
                },
              }}
            >
              <ProFormText
                width="sm"
                name="id"
                label="角色名称"
                hidden={true}
              />
              <ProFormText
                width="sm"
                name="roleName"
                label="角色名称"
                disabled={true}
              />
              <ProFormText
                width="sm"
                name="roleCode"
                label="角色编码"
                disabled={true}
              />
            </ProForm>
          }
          options={false}
        ></ProTable>
      </Drawer>
    </PageContainer>
  );
};

export default RoleManage;
