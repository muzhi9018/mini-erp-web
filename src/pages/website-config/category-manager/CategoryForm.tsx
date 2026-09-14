import {
  ModalForm,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Alert, Col } from 'antd';
import { useState } from 'react';
import {
  addCategoryI18n,
  createCategory,
} from '@/services/website/productCategory';

export const categoryLanguages = [
  {
    label: {
      id: 'categoryManager.language.zhCN',
      defaultMessage: '简体中文',
    },
    value: 'zh-CN',
  },
  {
    label: {
      id: 'categoryManager.language.zhTW',
      defaultMessage: '繁体中文',
    },
    value: 'zh-TW',
  },
  {
    label: {
      id: 'categoryManager.language.enUS',
      defaultMessage: '英语',
    },
    value: 'en-US',
  },
];

type CategoryFormValues = Website.CategoryI18n & {
  code: string;
  sortOrder?: number;
};

type CategoryFormProps = {
  category?: Website.Category;
  onClose: () => void;
  onSuccess: (locale: string) => void;
};

const CategoryForm = ({ category, onClose, onSuccess }: CategoryFormProps) => {
  const intl = useIntl();
  const [submitting, setSubmitting] = useState(false);
  const currentLocale = intl.locale;
  const defaultLocale = categoryLanguages.some(
    ({ value }) => value === currentLocale,
  )
    ? currentLocale
    : 'zh-CN';

  return (
    <ModalForm<CategoryFormValues>
      title={intl.formatMessage(
        category
          ? {
              id: 'categoryManager.addLanguage',
              defaultMessage: '添加语言',
            }
          : {
              id: 'categoryManager.create',
              defaultMessage: '新增分类',
            },
      )}
      width={640}
      open
      grid
      rowProps={{ gutter: 16, style: { marginInline: 0 } }}
      disabled={submitting}
      initialValues={{
        sortOrder: 0,
        locale: category ? undefined : defaultLocale,
      }}
      modalProps={{
        centered: true,
        destroyOnHidden: true,
        mask: { closable: false },
        closable: !submitting,
        keyboard: !submitting,
        styles: {
          body: { maxHeight: 'calc(100dvh - 160px)', overflowY: 'auto' },
        },
      }}
      submitter={{
        searchConfig: {
          submitText: intl.formatMessage(
            category
              ? {
                  id: 'categoryManager.addLanguage',
                  defaultMessage: '添加语言',
                }
              : {
                  id: 'categoryManager.createSubmit',
                  defaultMessage: '创建分类',
                },
          ),
          resetText: intl.formatMessage({
            id: 'categoryManager.cancel',
            defaultMessage: '取消',
          }),
        },
        resetButtonProps: { disabled: submitting },
        submitButtonProps: { loading: submitting },
      }}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onFinish={async (values) => {
        setSubmitting(true);
        const translation: Website.CategoryI18n = {
          locale: values.locale,
          name: values.name.trim(),
          description: values.description?.trim(),
          imageUrl: values.imageUrl?.trim(),
        };
        try {
          if (category) {
            await addCategoryI18n({
              ...translation,
              websiteProductCategoryId: category.id,
            });
          } else {
            await createCategory({
              code: values.code.trim(),
              sortOrder: values.sortOrder ?? 0,
              categoryI18n: translation,
            });
          }
        } catch {
          // 全局请求处理器展示接口错误，保留表单供用户修改或重试。
          return false;
        } finally {
          setSubmitting(false);
        }
        onSuccess(values.locale);
        return true;
      }}
    >
      <Col span={24}>
        <ProForm.Item>
          <Alert
            type="info"
            showIcon
            title={
              category
                ? intl.formatMessage(
                    {
                      id: 'categoryManager.translationTarget',
                      defaultMessage: '{name}（{code}）',
                    },
                    {
                      name: category.name,
                      code: category.code,
                    },
                  )
                : intl.formatMessage({
                    id: 'categoryManager.createHintTitle',
                    defaultMessage: '创建分类及首种语言内容',
                  })
            }
            description={intl.formatMessage(
              category
                ? {
                    id: 'categoryManager.addLanguageHint',
                    defaultMessage:
                      '请填写目标语言的名称和介绍。同一种语言只能添加一次，已有内容不会被覆盖。',
                  }
                : {
                    id: 'categoryManager.createHint',
                    defaultMessage:
                      '分类编码和排序由所有语言共用。新分类默认不在官网展示。',
                  },
            )}
          />
        </ProForm.Item>
      </Col>
      {!category && (
        <>
          <ProFormText
            colProps={{ xs: 24, sm: 16 }}
            name="code"
            label={intl.formatMessage({
              id: 'categoryManager.code',
              defaultMessage: '分类编码',
            })}
            placeholder={intl.formatMessage({
              id: 'categoryManager.codePlaceholder',
              defaultMessage: '例如 wall-materials',
            })}
            extra={intl.formatMessage({
              id: 'categoryManager.codeHint',
              defaultMessage: '用于标识分类，所有分类的编码必须唯一。',
            })}
            fieldProps={{ maxLength: 128 }}
            rules={[
              {
                required: true,
                whitespace: true,
                message: intl.formatMessage({
                  id: 'categoryManager.codeRequired',
                  defaultMessage: '请输入分类编码',
                }),
              },
            ]}
          />
          <ProFormDigit
            colProps={{ xs: 24, sm: 8 }}
            name="sortOrder"
            label={intl.formatMessage({
              id: 'categoryManager.sortOrder',
              defaultMessage: '排序',
            })}
            extra={intl.formatMessage({
              id: 'categoryManager.sortHint',
              defaultMessage: '数值越小越靠前。',
            })}
            min={-2147483648}
            max={2147483647}
            fieldProps={{ precision: 0 }}
          />
        </>
      )}
      <ProFormSelect
        colProps={{ xs: 24, sm: 8 }}
        name="locale"
        label={intl.formatMessage(
          category
            ? {
                id: 'categoryManager.targetLanguage',
                defaultMessage: '目标语言',
              }
            : {
                id: 'categoryManager.initialLanguage',
                defaultMessage: '首种语言',
              },
        )}
        placeholder={intl.formatMessage({
          id: 'categoryManager.languageRequired',
          defaultMessage: '请选择语言',
        })}
        options={categoryLanguages.map((language) => ({
          ...language,
          label: intl.formatMessage(language.label),
          disabled: language.value === category?.locale,
        }))}
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'categoryManager.languageRequired',
              defaultMessage: '请选择语言',
            }),
          },
        ]}
      />
      <ProFormText
        colProps={{ xs: 24, sm: 16 }}
        name="name"
        label={intl.formatMessage({
          id: 'categoryManager.name',
          defaultMessage: '分类名称',
        })}
        placeholder={intl.formatMessage({
          id: 'categoryManager.namePlaceholder',
          defaultMessage: '请输入所选语言的分类名称',
        })}
        fieldProps={{ maxLength: 256 }}
        rules={[
          {
            required: true,
            whitespace: true,
            message: intl.formatMessage({
              id: 'categoryManager.nameRequired',
              defaultMessage: '请输入分类名称',
            }),
          },
        ]}
      />
      <ProFormTextArea
        name="description"
        label={intl.formatMessage({
          id: 'categoryManager.description',
          defaultMessage: '分类描述',
        })}
        placeholder={intl.formatMessage({
          id: 'categoryManager.descriptionPlaceholder',
          defaultMessage: '选填，使用所选语言介绍此分类',
        })}
        fieldProps={{ autoSize: { minRows: 3, maxRows: 5 } }}
      />
      <ProFormText
        name="imageUrl"
        label={intl.formatMessage({
          id: 'categoryManager.imageUrl',
          defaultMessage: '分类图片地址',
        })}
        placeholder={intl.formatMessage({
          id: 'categoryManager.imageUrlPlaceholder',
          defaultMessage: '选填，例如 https://example.com/category.jpg',
        })}
        fieldProps={{ maxLength: 512 }}
      />
    </ModalForm>
  );
};

export default CategoryForm;
