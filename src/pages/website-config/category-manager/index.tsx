import { PlusOutlined } from '@ant-design/icons';
import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, message } from 'antd';
import { useRef, useState } from 'react';
import { listCategories } from '@/services/website/productCategory';
import CategoryForm, { categoryLanguages } from './CategoryForm';

const CategoryManager = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(undefined);
  const [messageApi, contextHolder] = message.useMessage();
  const [form, setForm] = useState<{ category?: Website.Category }>();
  const columns: ProColumns<Website.Category>[] = [
    {
      title: intl.formatMessage({
        id: 'categoryManager.id',
        defaultMessage: '分类 ID',
      }),
      dataIndex: 'id',
      width: 100,
    },
    {
      title: intl.formatMessage({
        id: 'categoryManager.name',
        defaultMessage: '分类名称',
      }),
      dataIndex: 'name',
    },
    {
      title: intl.formatMessage({
        id: 'categoryManager.code',
        defaultMessage: '分类编码',
      }),
      dataIndex: 'code',
    },
    {
      title: intl.formatMessage({
        id: 'categoryManager.language',
        defaultMessage: '语言',
      }),
      dataIndex: 'locale',
      width: 120,
      valueEnum: Object.fromEntries(
        categoryLanguages.map(({ label, value }) => [
          value,
          intl.formatMessage(label),
        ]),
      ),
    },
    {
      title: intl.formatMessage({
        id: 'categoryManager.sortOrder',
        defaultMessage: '排序',
      }),
      dataIndex: 'sortOrder',
      width: 100,
    },
    {
      title: intl.formatMessage({
        id: 'categoryManager.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'isShow',
      width: 120,
      valueEnum: {
        true: {
          text: intl.formatMessage({
            id: 'categoryManager.enabled',
            defaultMessage: '启用',
          }),
          status: 'Success',
        },
        false: {
          text: intl.formatMessage({
            id: 'categoryManager.disabled',
            defaultMessage: '停用',
          }),
          status: 'Default',
        },
      },
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'categoryManager.title',
        defaultMessage: '分类管理',
      })}
    >
      {contextHolder}
      <ProTable<Website.Category>
        actionRef={actionRef}
        rowKey="id"
        headerTitle={intl.formatMessage({
          id: 'categoryManager.list',
          defaultMessage: '分类列表',
        })}
        columns={[
          ...columns,
          {
            title: intl.formatMessage({
              id: 'categoryManager.actions',
              defaultMessage: '操作',
            }),
            valueType: 'option',
            width: 120,
            render: (_, category) => [
              <Button
                key="add-language"
                type="link"
                onClick={() => setForm({ category })}
              >
                {intl.formatMessage({
                  id: 'categoryManager.addLanguage',
                  defaultMessage: '添加语言',
                })}
              </Button>,
            ],
          },
        ]}
        tooltip={intl.formatMessage({
          id: 'categoryManager.listHint',
          defaultMessage:
            '列表按当前界面语言展示；其他语言内容可切换界面语言后查看。',
        })}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setForm({})}
          >
            {intl.formatMessage({
              id: 'categoryManager.create',
              defaultMessage: '新增分类',
            })}
          </Button>,
        ]}
        params={{ locale: intl.locale }}
        request={async ({ current = 1, pageSize = 10 }) => {
          const page = await listCategories({ pageNum: current, pageSize });
          return { data: page.records, total: page.total, success: true };
        }}
        search={false}
        options={false}
        pagination={{
          defaultPageSize: 10,
          showTotal: (total) =>
            intl.formatMessage(
              {
                id: 'categoryManager.total',
                defaultMessage: '共 {total} 条',
              },
              { total },
            ),
        }}
        scroll={{ x: 840 }}
      />
      {form && (
        <CategoryForm
          category={form.category}
          onClose={() => setForm(undefined)}
          onSuccess={(locale) => {
            const language = categoryLanguages.find(
              ({ value }) => value === locale,
            )?.label;
            messageApi.success(
              intl.formatMessage(
                form.category
                  ? {
                      id: 'categoryManager.addLanguageSuccess',
                      defaultMessage: '语言已添加（{language}）',
                    }
                  : {
                      id: 'categoryManager.createSuccess',
                      defaultMessage: '分类已创建（{language}）',
                    },
                { language: language ? intl.formatMessage(language) : locale },
              ),
            );
            void actionRef.current?.reload();
          }}
        />
      )}
    </PageContainer>
  );
};

export default CategoryManager;
