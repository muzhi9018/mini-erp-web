import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { findUsersByPage } from '@/services/user/user';

const columns: ProColumns<User.SysUser>[] = [
  { title: '用户名', dataIndex: 'username' },
  { title: '用户编号', dataIndex: 'userNo', search: false },
  { title: '昵称', dataIndex: 'realName' },
  { title: '手机号', dataIndex: 'mobile' },
  {
    title: '状态',
    dataIndex: 'status',
    valueEnum: {
      1: { text: '正常', status: 'Success' },
      0: { text: '禁用', status: 'Error' },
    },
  },
  {
    title: '已授权角色',
    dataIndex: 'roles',
    search: false,
    renderText: (roles: User.SysUser['roles']) =>
      roles
        ?.map((role) => role.roleName)
        .filter(Boolean)
        .join('、') || '-',
  },
  { title: '备注', dataIndex: 'remark', search: false },
  {
    title: '创建时间',
    dataIndex: 'gmtCreate',
    valueType: 'dateTime',
    search: false,
  },
];

const UserManage = () => (
  <PageContainer>
    <ProTable<User.SysUser>
      rowKey="id"
      columns={columns}
      headerTitle="用户列表"
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
  </PageContainer>
);

export default UserManage;
