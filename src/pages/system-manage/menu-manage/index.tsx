import {
  ModalForm,
  PageContainer,
  type ProColumns,
  ProFormDigit,
  ProFormRadio,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import React, { useState } from 'react';
import { Access, useAccess } from 'umi';
import {
  addMenu,
  deleteMenu,
  findByParentId,
  findTopLevelMenu,
  updateMenu,
} from '@/services/system/system';

const MenuManage: React.FC = () => {
  const { hasPermission } = useAccess();
  const [createModalOpen, handleModalOpen] = useState<boolean>(false);
  const [addTopLevelMenu, handleTopLevelMenu] = useState<boolean>(true);
  const [menuFormData, setMenuFormData] = useState<System.Menu>({});
  const [currentFromData, setCurrentFromData] = useState<System.Menu>({});
  const [parentType, setParentType] = useState<number>(1);
  const [list, setList] = useState<System.MenuVO[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshNode, setRefreshNode] = useState<System.MenuVO>({});
  const [page, setPage] = useState<Common.Page>({
    current: 1,
    pageSize: 15,
    total: 0,
  });
  const [editableKeys, setEditableKeys] = useState<string[]>([]);
  const [editRecord, setEditRecord] = useState<System.MenuVO>({});

  /**
   * 顶级菜单查询接口
   * @param params 参数
   */
  const topLevelMenuList = async (params: any) => {
    setLoading(true);
    const pageInfo = await findTopLevelMenu(params).finally(() =>
      setLoading(false),
    );
    pageInfo.records.forEach((menu) => {
      menu.children = [];
    });
    setList(pageInfo.records);
    setPage({ ...page, total: pageInfo.total });
    setExpandedRowKeys([]);
    return { data: pageInfo.records, total: pageInfo.total };
  };

  /**
   * 级联关闭所有子级列表
   * @param children 子级列表
   * @param keys kyes
   */
  const cascadeCloseChildren = async (
    children: System.MenuVO[],
    keys: string[],
  ) => {
    for (const item of children) {
      await cascadeCloseChildren(item.children ?? [], keys);
      const index = keys.indexOf(item.id ?? '');
      if (index !== -1) {
        keys.splice(index, 1);
      }
    }
  };

  /**
   * 展开，关闭回调函数
   * @param expanded 是否展开
   * @param record 操作的行数据
   */
  const handleExpand = async (expanded: boolean, record: System.MenuVO) => {
    if (expanded) {
      setLoading(true);
      const children = await findByParentId(record.id ?? '0', {}).finally(() =>
        setLoading(false),
      );
      children.forEach((child) => {
        if (child.type === 1 || child.type === 2) {
          child.children = [];
        }
      });
      record.children = children;
      // 如果展开行，则将其添加到已展开行的keys中
      setExpandedRowKeys([...expandedRowKeys, record.id ?? '']);
    } else {
      const keys = expandedRowKeys;
      // 还要关闭所有子级列表
      await cascadeCloseChildren(record.children ?? [], keys);
      // 如果关闭行，则将其从已展开行的keys中移除
      setExpandedRowKeys(keys.filter((key) => key !== record.id));
    }
  };

  /**
   * 刷新数据函数
   * @param refreshNode 要刷新的节点
   */
  const refreshList = async (refreshNode: System.MenuVO) => {
    if (!refreshNode.id) {
      // 刷新最外层，把所有展开的关闭
      setExpandedRowKeys([]);
      await topLevelMenuList({ current: 1, size: 15 });
    } else {
      await handleExpand(true, refreshNode);
    }
  };

  /**
   * 打开新增顶级菜单窗口
   */
  const openTopLevelMenu = () => {
    handleModalOpen(true);
    handleTopLevelMenu(true);
    setRefreshNode({});
  };

  /**
   * 新增子级菜单
   * @param data
   */
  const openSubMenu = async (data: System.MenuVO) => {
    handleModalOpen(true);
    handleTopLevelMenu(false);
    const menu: System.Menu = {
      parentId: data.id,
      clientId: data.clientId,
      parentMenuName: data.name,
    };
    setParentType(data.type ?? 0);
    setMenuFormData(menu);
    setRefreshNode(data);
  };
  /**
   * 清空表单
   */
  const formReset = () => {
    setMenuFormData({});
    setCurrentFromData({});
    setParentType(1);
  };

  /**
   * 提交表单
   * @param data 提交参数
   */
  const addMenuHandler = async (data: System.Menu) => {
    if (data.id) {
      await updateMenu(data, {});
    } else {
      if (addTopLevelMenu) {
        data.parentId = '0';
      }
      await addMenu(data, {});
    }
    formReset();
    handleModalOpen(false);
    await refreshList(refreshNode);
  };

  /**
   * 删除节点设置要刷新的节点
   * 这里删除是要刷新父节点
   * @param delMenu
   * @param menus
   */
  const findParentNode = async (
    delMenu: System.MenuVO,
    menus: System.MenuVO[],
  ): Promise<System.MenuVO> => {
    for (const menu of menus) {
      if (delMenu.parentId === menu.id) {
        return menu;
      }
      const parentNode = await findParentNode(delMenu, menu.children ?? []);
      if (parentNode.id) {
        return parentNode;
      }
    }
    return {};
  };

  /**
   * 删除菜单
   * @param data 删除对象
   */
  const delMenuFun = async (data: System.MenuVO) => {
    // 置空刷新对象
    setRefreshNode({});
    const parentMenu = await findParentNode(data, list);
    await deleteMenu(data);
    await refreshList(parentMenu);
  };

  /**
   * 编辑参数校验
   * @param record record
   */
  const verifyEditData = async (record: System.MenuVO) => {
    // 独立名校验
    if (!record.name) {
      message.warning('[名称]不能为空');
      return false;
    }
    // 目录/菜单校验
    if (record.type === 1 || record.type === 2) {
      if (!record.path) {
        message.warning('[Path]不能为空');
        return false;
      }
      if (!record.component) {
        message.warning('[组件]不能为空');
        return false;
      }
    }
    // 菜单/按钮/接口校验
    if (record.type === 2 || record.type === 3 || record.type === 4) {
      if (!record.permissionCode) {
        message.warning('[权限码]不能为空');
        return false;
      }
    }
    return true;
  };

  /**
   * 编辑数据
   * @param record
   * @param origin 原始的数据
   */
  const editHandler = async (record: System.MenuVO, origin: System.MenuVO) => {
    // 没有实际数据的更改直接关闭编辑框
    if (
      record.name === origin.name &&
      record.path === origin.path &&
      record.component === origin.component &&
      record.permissionCode === origin.permissionCode &&
      record.sort === origin.sort
    ) {
      setEditableKeys([]);
      return;
    }
    if (!(await verifyEditData(record))) {
      return;
    }
    await updateMenu(record, {});
    setRefreshNode({});
    const parentMenu = await findParentNode(record, list);
    await refreshList(parentMenu);
    setEditableKeys([]);
  };

  const columns: ProColumns<System.MenuVO>[] = [
    {
      title: '所属客户端',
      width: 250,
      dataIndex: 'clientId',
      editable: false,
    },
    {
      title: '名称',
      width: 120,
      dataIndex: 'name',
    },
    {
      title: 'Path',
      width: 120,
      dataIndex: 'path',
      search: false,
      editable: () => editRecord.type !== 3 && editRecord.type !== 4,
      render: (_) => <a>{_}</a>,
    },
    {
      title: '组件',
      width: 120,
      dataIndex: 'component',
      search: false,
      editable: () => editRecord.type !== 3 && editRecord.type !== 4,
      render: (_) => <a>{_}</a>,
    },
    {
      title: '权限码',
      width: 120,
      dataIndex: 'permissionCode',
      search: false,
      render: (_) => <Tag color={'blue'}>{_}</Tag>,
    },
    {
      title: '类型',
      width: 120,
      dataIndex: 'type',
      search: false,
      valueEnum: { 1: '目录', 2: '菜单', 3: '按钮', 4: '接口' },
      editable: false,
      render: (_) => <Tag color={'green'}>{_}</Tag>,
    },
    {
      title: '排序',
      width: 120,
      search: false,
      dataIndex: 'sort',
    },
    {
      title: '操作',
      width: 200,
      valueType: 'option',
      key: 'option',
      render: (_text, record) => {
        const elements = [
          <Access
            key={`access-add-${record.id}`}
            accessible={hasPermission('system-manage:menu-manage:add')}
          >
            <a
              key={`add-${record.id}`}
              onClick={async () => await openSubMenu(record)}
            >
              新增子菜单
            </a>
            ,
          </Access>,
          <Access
            key={`access-edit-${record.id}`}
            accessible={hasPermission('system-manage:menu-manage:edit')}
          >
            <a
              key={`edit-${record.id}`}
              onClick={() => {
                setEditRecord(record);
                setEditableKeys([record.id ?? '']);
              }}
            >
              编辑
            </a>
          </Access>,
          <Access
            key={`access-del-${record.id}`}
            accessible={hasPermission('system-manage:menu-manage:del')}
          >
            <Popconfirm
              key="delete-comfirm"
              title="您确定要删除当前菜单吗？"
              okButtonProps={{
                style: {
                  background: 'red',
                  color: 'white',
                },
              }}
              onConfirm={() => delMenuFun(record)}
              okText="确认"
              cancelText="取消"
            >
              <a key={`delete-menu-' + record.id`} style={{ color: 'red' }}>
                删除
              </a>
            </Popconfirm>
          </Access>,
        ];
        if (record.type === 3 || record.type === 4) {
          elements.splice(0, 1);
        }
        return elements;
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<System.MenuVO>
        editable={{
          type: 'single',
          onSave: (_key, record, origin) => editHandler(record, origin),
          onCancel: async () => setEditableKeys([]),
          editableKeys,
          actionRender: (_row, _config, defaultDom) => [
            defaultDom.save,
            defaultDom.cancel,
          ],
        }}
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={loading}
        request={(params) => {
          return topLevelMenuList(params);
        }}
        pagination={{
          showQuickJumper: true,
          defaultCurrent: page.current,
          defaultPageSize: page.pageSize,
          current: page.current,
          total: page.total,
          pageSizeOptions: [10, 20, 30, 40],
          // onChange: (current, pageSize) => setPage({ ...page, current, pageSize }),
        }}
        expandable={{
          defaultExpandAllRows: false,
          onExpand: handleExpand,
          expandedRowKeys,
        }}
        search={{}}
        dateFormatter="string"
        headerTitle="系统菜单"
        options={false}
        toolBarRender={() => [
          <Access
            key="access-add-menu"
            accessible={hasPermission('system-manage:menu-manage:add')}
          >
            <Button
              key="add-menu"
              type="primary"
              onClick={() => openTopLevelMenu()}
            >
              新建菜单
            </Button>
          </Access>,
        ]}
      ></ProTable>
      {/* 新增菜单 */}
      <ModalForm<System.Menu>
        loading={loading}
        initialValues={menuFormData}
        title="新增菜单"
        width="490px"
        modalProps={{
          destroyOnHidden: true,
        }}
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onValuesChange={(_changedValues, values) => {
          setCurrentFromData(values);
        }}
        onReset={async () => formReset()}
        onFinish={async (value) => addMenuHandler(value)}
        submitter={{
          render: (props, dom) => {
            return [
              <Button
                htmlType="button"
                onClick={() => {
                  props.reset();
                  handleModalOpen(false);
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
        <ProFormText
          width="lg"
          name="clientId"
          label="所属客户端"
          placeholder="请输入所属客户端"
          disabled={!addTopLevelMenu}
          rules={[
            {
              required: true,
              message: '请输入所属客户端',
            },
          ]}
        />
        <ProFormText
          width="lg"
          name="parentMenuName"
          label="所属父级目录"
          disabled={!addTopLevelMenu}
          hidden={addTopLevelMenu}
          rules={[
            {
              required: !addTopLevelMenu,
            },
          ]}
        />
        <ProFormText
          width="lg"
          name="parentId"
          label="父级id"
          hidden={true}
          rules={[
            {
              required: !addTopLevelMenu,
            },
          ]}
        />
        <ProFormText
          width="lg"
          name="name"
          label="名称"
          placeholder="请输入名称"
          rules={[
            {
              required: true,
              message: '请输入名称',
            },
          ]}
        />
        <ProFormText
          width="lg"
          name="path"
          label="Path"
          placeholder="请输入 Path"
          hidden={parentType === 2}
          rules={[
            {
              required:
                currentFromData.type === 1 || currentFromData.type === 2,
              message: '请输入菜单 Path',
            },
          ]}
        />
        <ProFormText
          width="lg"
          name="component"
          label="组件"
          placeholder="请输入组件"
          hidden={parentType === 2}
          rules={[
            {
              required:
                currentFromData.type === 1 || currentFromData.type === 2,
              message: '请输入菜单组件',
            },
          ]}
        />
        <ProFormText
          width="lg"
          name="permissionCode"
          label="权限码"
          placeholder="请输入权限码"
          rules={[
            {
              required: currentFromData.type !== 1,
              message: '请输入权限码',
            },
          ]}
        />
        <ProFormDigit
          label="排序"
          name="sort"
          min={0}
          fieldProps={{ precision: 0 }}
        />
        <ProFormRadio.Group
          name="type"
          label="菜单类型"
          rules={[
            {
              required: true,
              message: '请选择菜单类型',
            },
          ]}
          options={[
            {
              label: '目录',
              value: 1,
              disabled: parentType !== 1,
            },
            {
              label: '菜单',
              value: 2,
              disabled: parentType !== 1,
            },
            {
              label: '按钮',
              value: 3,
              disabled: parentType !== 2,
            },
            {
              label: '接口',
              value: 4,
              disabled: parentType !== 2,
            },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default MenuManage;
