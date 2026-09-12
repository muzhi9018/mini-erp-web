import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';

type Category = {
  id: number;
  name: string;
  code: string;
  sort: number;
  status: 'enabled' | 'disabled';
};

const categories: Category[] = [
  { id: 1, name: '墙面材料', code: 'wall', sort: 1, status: 'enabled' },
  { id: 2, name: '户外材料', code: 'outdoor', sort: 2, status: 'enabled' },
  { id: 3, name: '地板材料', code: 'floor', sort: 3, status: 'enabled' },
  { id: 4, name: '柜体材料', code: 'cabinet', sort: 4, status: 'enabled' },
  { id: 5, name: '装饰型材', code: 'profile', sort: 5, status: 'disabled' },
];

const columns: ProColumns<Category>[] = [
  { title: '分类 ID', dataIndex: 'id', width: 100 },
  { title: '分类名称', dataIndex: 'name' },
  { title: '分类编码', dataIndex: 'code' },
  { title: '排序', dataIndex: 'sort', width: 100 },
  {
    title: '状态',
    dataIndex: 'status',
    width: 120,
    valueEnum: {
      enabled: { text: '启用', status: 'Success' },
      disabled: { text: '停用', status: 'Default' },
    },
  },
];

const CategoryManager = () => (
  <PageContainer title="分类管理">
    <ProTable<Category>
      rowKey="id"
      headerTitle="分类列表"
      columns={columns}
      dataSource={categories}
      search={false}
      options={false}
      pagination={{
        defaultPageSize: 10,
        showTotal: (total) => `共 ${total} 条`,
      }}
      scroll={{ x: 600 }}
    />
  </PageContainer>
);

export default CategoryManager;
