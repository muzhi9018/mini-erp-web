import { PictureOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Alert, Col, Form, Image, message, Spin, Upload } from 'antd';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useEffect, useState } from 'react';
import {
  uploadAttachment,
  WEBSITE_PRODUCT_CATEGORY_ATTACHMENT_MODEL,
} from '@/services/system/attachment';
import { getSystemLocales } from '@/services/system/locale';
import {
  addCategoryI18n,
  createCategory,
} from '@/services/website/productCategory';

type CategoryFormValues = Website.CategoryI18n & {
  code: string;
  sortOrder?: number;
};

type CategoryFormProps = {
  category?: Website.Category;
  onClose: () => void;
  onSuccess: (locale: string, languageName: string) => void;
};

type CategoryImageUploadProps = {
  disabled?: boolean;
  onChange?: (value?: number | string) => void;
  onUploadingChange: (uploading: boolean) => void;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const readImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const CategoryImageUpload = ({
  disabled,
  onChange,
  onUploadingChange,
}: CategoryImageUploadProps) => {
  const intl = useIntl();
  const [messageApi, messageContext] = message.useMessage();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState('');

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      messageApi.error(
        intl.formatMessage({
          id: 'categoryManager.imageTypeError',
          defaultMessage: '仅支持 JPG、JPEG 或 PNG 图片',
        }),
      );
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      messageApi.error(
        intl.formatMessage({
          id: 'categoryManager.imageSizeError',
          defaultMessage: '图片大小不能超过 5 MB',
        }),
      );
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const customRequest: UploadProps['customRequest'] = async ({
    file,
    onError,
    onSuccess,
  }) => {
    onChange?.(undefined);
    onUploadingChange(true);
    try {
      const attachment = await uploadAttachment(
        file as File,
        WEBSITE_PRODUCT_CATEGORY_ATTACHMENT_MODEL,
      );
      if (attachment.id === undefined || attachment.id === null) {
        throw new Error('Attachment id is missing');
      }
      onChange?.(attachment.id);
      onSuccess?.(attachment);
    } catch (error) {
      messageApi.error(
        intl.formatMessage({
          id: 'categoryManager.imageUploadError',
          defaultMessage: '图片上传失败，请重试',
        }),
      );
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      onUploadingChange(false);
    }
  };

  const handlePreview = async (file: UploadFile) => {
    const source =
      file.url ||
      file.thumbUrl ||
      (file.originFileObj
        ? await readImage(file.originFileObj as RcFile)
        : undefined);
    if (source) setPreviewImage(source);
  };

  return (
    <>
      {messageContext}
      <Upload
        accept="image/jpeg,image/png"
        listType="picture-card"
        maxCount={1}
        disabled={disabled}
        fileList={fileList}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        onChange={({ fileList: nextFileList }) => {
          setFileList(
            nextFileList.map((file) => {
              const attachment = file.response as System.Attachment | undefined;
              return attachment?.previewUrl
                ? {
                    ...file,
                    url: attachment.previewUrl,
                    thumbUrl: attachment.previewUrl,
                  }
                : file;
            }),
          );
        }}
        onPreview={handlePreview}
        onRemove={() => {
          onChange?.(undefined);
          setPreviewImage('');
        }}
      >
        <Spin spinning={fileList.some(({ status }) => status === 'uploading')}>
          <PictureOutlined />
          <div className="mt-2">
            {intl.formatMessage({
              id: 'categoryManager.uploadImage',
              defaultMessage: '上传图片',
            })}
          </div>
        </Spin>
      </Upload>
      {previewImage && (
        <Image
          alt={intl.formatMessage({
            id: 'categoryManager.imagePreview',
            defaultMessage: '分类图片预览',
          })}
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: true,
            src: previewImage,
            onVisibleChange: (visible) => {
              if (!visible) setPreviewImage('');
            },
          }}
        />
      )}
    </>
  );
};

const CategoryForm = ({ category, onClose, onSuccess }: CategoryFormProps) => {
  const intl = useIntl();
  const [form] = Form.useForm<CategoryFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [languages, setLanguages] = useState<System.SystemLocale[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const defaultLanguage = languages.find(({ defaultLocal }) => defaultLocal);
  const languageUnavailable =
    !languages.length || (!category && !defaultLanguage);
  const busy = submitting || uploadingImage;

  useEffect(() => {
    let active = true;
    getSystemLocales()
      .then((locales) => {
        if (!active) return;
        setLanguages(locales);
        if (!category) {
          form.setFieldValue(
            'locale',
            locales.find(({ defaultLocal }) => defaultLocal)?.code,
          );
        }
      })
      .catch(() => {
        // 接口错误由全局请求处理器提示，语言未就绪时禁止提交。
      })
      .finally(() => {
        if (active) setLoadingLanguages(false);
      });
    return () => {
      active = false;
    };
  }, [category, form]);

  return (
    <ModalForm<CategoryFormValues>
      form={form}
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
      disabled={busy}
      initialValues={{
        sortOrder: 0,
      }}
      modalProps={{
        centered: true,
        destroyOnHidden: true,
        mask: { closable: false },
        closable: !busy,
        keyboard: !busy,
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
        resetButtonProps: { disabled: busy },
        submitButtonProps: {
          loading: submitting,
          disabled: loadingLanguages || languageUnavailable || uploadingImage,
        },
      }}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onFinish={async (values) => {
        const language = category
          ? languages.find(({ code }) => code === values.locale)
          : defaultLanguage;
        if (
          loadingLanguages ||
          uploadingImage ||
          !language ||
          language.code === category?.locale
        )
          return false;
        setSubmitting(true);
        const translation: Website.CategoryI18n = {
          locale: language.code,
          name: values.name.trim(),
          description: values.description?.trim(),
          imageAttachmentId: values.imageAttachmentId,
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
        onSuccess(language.code, language.nativeName || language.name);
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
        disabled={!category || loadingLanguages || submitting}
        fieldProps={{
          loading: loadingLanguages,
          allowClear: Boolean(category),
        }}
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
        extra={
          !loadingLanguages && languageUnavailable
            ? intl.formatMessage({
                id: 'categoryManager.languageUnavailable',
                defaultMessage:
                  '系统语言不可用或未配置默认语言，请检查配置后重新打开表单。',
              })
            : !category
              ? intl.formatMessage({
                  id: 'categoryManager.defaultLanguageHint',
                  defaultMessage:
                    '新增分类固定使用系统默认语言，创建后可添加其他语言。',
                })
              : undefined
        }
        options={languages
          .filter((language) => category || language.defaultLocal)
          .map((language) => ({
            value: language.code,
            label: language.nativeName || language.name,
            disabled: language.code === category?.locale,
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
      <ProForm.Item
        name="imageAttachmentId"
        label={intl.formatMessage({
          id: 'categoryManager.image',
          defaultMessage: '分类图片',
        })}
        extra={intl.formatMessage({
          id: 'categoryManager.imageUploadHint',
          defaultMessage: '选填，支持 JPG、JPEG、PNG，大小不超过 5 MB。',
        })}
      >
        <CategoryImageUpload
          disabled={busy}
          onUploadingChange={setUploadingImage}
        />
      </ProForm.Item>
    </ModalForm>
  );
};

export default CategoryForm;
