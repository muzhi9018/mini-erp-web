import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';

type Product = {
  id: number;
  name: string;
  code: string;
  category: string;
  status: 'published' | 'draft';
};

const products: Product[] = [
  {
    id: 1,
    name: '塑木材料',
    code: 'wpc',
    category: '户外材料',
    status: 'published',
  },
  {
    id: 2,
    name: '装饰墙板',
    code: 'wall-panel',
    category: '墙面材料',
    status: 'published',
  },
  {
    id: 3,
    name: '复合地板',
    code: 'composite-floor',
    category: '地板材料',
    status: 'draft',
  },
];

const columns: ProColumns<Product>[] = [
  { title: '产品 ID', dataIndex: 'id', width: 100 },
  { title: '产品名称', dataIndex: 'name' },
  { title: '产品编码', dataIndex: 'code' },
  { title: '所属分类', dataIndex: 'category' },
  {
    title: '状态',
    dataIndex: 'status',
    width: 120,
    valueEnum: {
      published: { text: '已发布', status: 'Success' },
      draft: { text: '草稿', status: 'Default' },
    },
  },
];

const ProductManager = () => (
  <PageContainer title="产品管理">
    <ProTable<Product>
      rowKey="id"
      headerTitle="产品列表"
      columns={columns}
      dataSource={products}
      search={false}
      options={false}
      pagination={{
        defaultPageSize: 10,
        showTotal: (total) => `共 ${total} 条`,
      }}
      scroll={{ x: 700 }}
    />
  </PageContainer>
);

export default ProductManager;
