import { Button, Form, Input, Modal, Select } from 'antd';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Globe,
  LockKeyhole,
  PanelsTopLeft,
  RefreshCw,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { Ref } from 'react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { isDomain, normalizeDomain } from '@/security/vault/domain';
import { ITEM_SCHEMA_VERSION, validatePlain } from '@/security/vault/protocol';
import { trapDialogTab, useDialogBackground } from './dialog';
import styles from './Entries.module.css';
import { matchSite, OTHER_SITE, useSites } from './sites';
import TotpEditor from './TotpEditor';
import TotpImportWizard from './TotpImportWizard';
import { useText } from './text';

export type Editor = {
  itemId?: string;
  groupId?: string;
  plain: Vault.PlainItem;
  hasTotp?: boolean;
  totpInfo?: Vault.TotpInfo | null;
  totpAction?: 'replace' | 'remove';
};
export type EditorHandle = { leave: (action: () => void) => void };
export default function ItemEditor(props: {
  ref?: Ref<EditorHandle>;
  editor: Editor;
  busy: boolean;
  uncertain: boolean;
  conflict: boolean;
  onClose: () => void;
  onReload: () => void;
  onSave: (plain: Vault.PlainItem, preserveTotp: boolean) => void;
  groupName?: string;
  onDelete: (id: string) => void;
  onDraftCode: (config: Vault.Totp) => Promise<Vault.TotpCode>;
  onGenerate: (length: number, symbols: boolean) => Promise<string>;
}) {
  const t = useText();
  const [form] = Form.useForm<Vault.PlainItem>();
  const title = Form.useWatch('title', form);
  const username = Form.useWatch('username', form);
  const website = Form.useWatch('website', form) || '';
  const sites = useSites();
  const [siteChoice, setSiteChoice] = useState<string>();
  const [siteSearch, setSiteSearch] = useState('');
  const [siteOpen, setSiteOpen] = useState(false);
  const sitePicker = useRef<HTMLDivElement>(null);
  const otherButton = useRef<HTMLButtonElement>(null);
  const otherFocused = useRef(false);
  const availableSites = sites.isError ? [] : sites.data || [];
  const matchedSite = matchSite(availableSites, website);
  const selectedSite =
    siteChoice === OTHER_SITE
      ? OTHER_SITE
      : sites.isError || sites.isPending
        ? undefined
        : matchedSite
          ? normalizeDomain(matchedSite.siteDomain)
          : props.editor.itemId || siteChoice !== undefined
            ? OTHER_SITE
            : undefined;
  const domainReadonly =
    selectedSite !== OTHER_SITE &&
    (!!matchedSite || (!props.editor.itemId && !sites.isError));
  const filteredSites = availableSites.filter(
    (site) =>
      normalizeDomain(site.siteDomain) &&
      [site.siteName, site.siteDomain].some((value) =>
        value
          .toLocaleLowerCase()
          .includes(siteSearch.trim().toLocaleLowerCase()),
      ),
  );
  const chooseSite = (value: string) => {
    setSiteChoice(value);
    setSiteOpen(false);
    setSiteSearch('');
    if (value !== OTHER_SITE) form.setFieldValue('website', value);
    setDirty(true);
    if (value === OTHER_SITE)
      requestAnimationFrame(() => form.getFieldInstance('website')?.focus());
  };
  const [totp, setTotp] = useState<Vault.Totp | null>(null);
  const [preserveTotp, setPreserveTotp] = useState(
    !!props.editor.hasTotp && props.editor.totpAction !== 'remove',
  );
  const [dirty, setDirty] = useState(props.editor.totpAction === 'remove');
  const [wizard, setWizard] = useState(props.editor.totpAction === 'replace');
  const [confirmation, setConfirmation] = useState<'discard' | 'generate'>();
  const dialog = useRef<HTMLDivElement>(null);
  const [dialogReady, setDialogReady] = useState(false);
  useDialogBackground(dialog, !!confirmation && dialogReady);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generationFailed, setGenerationFailed] = useState(false);
  const generation = useRef(0);
  const generationPending = useRef(false);
  const [visible, setVisible] = useState(false);
  const [length, setLength] = useState(24);
  const [symbols, setSymbols] = useState(true);
  const next = useRef<(() => void) | undefined>(undefined);
  const alive = useRef(true);
  const addButton = useRef<HTMLDivElement>(null);
  const generatorButton = useRef<HTMLDivElement>(null);
  const focusGenerator = () =>
    requestAnimationFrame(() => {
      if (!document.hidden)
        generatorButton.current?.querySelector('button')?.focus();
    });
  useEffect(() => {
    alive.current = true;
    form.setFieldsValue({
      ...props.editor.plain,
      website:
        normalizeDomain(props.editor.plain.website) ||
        props.editor.plain.website,
    });
    setSiteChoice(undefined);
    setSiteOpen(false);
    setSiteSearch('');
    setTotp(null);
    setPreserveTotp(
      !!props.editor.hasTotp && props.editor.totpAction !== 'remove',
    );
    setDirty(props.editor.totpAction === 'remove');
    setWizard(props.editor.totpAction === 'replace');
    setConfirmation(undefined);
    setDialogReady(false);
    setGenerating(false);
    setGenerated(false);
    setGenerationFailed(false);
    generationPending.current = false;
    form.getFieldInstance('title')?.focus();
    return () => {
      alive.current = false;
      generation.current++;
      form.resetFields();
    };
  }, [props.editor]);
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 20000);
    return () => clearTimeout(timer);
  }, [visible]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        setVisible(false);
        setSiteOpen(false);
        setWizard(false);
        setConfirmation(undefined);
        setDialogReady(false);
        generation.current++;
        generationPending.current = false;
        setGenerating(false);
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty || props.uncertain) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', unload);
    return () => window.removeEventListener('beforeunload', unload);
  }, [dirty, props.uncertain]);
  const leave = (action: () => void) => {
    if (props.busy) return;
    if (dirty || props.uncertain) {
      next.current = action;
      setConfirmation('discard');
    } else action();
  };
  useImperativeHandle(props.ref, () => ({ leave }));
  const close = () => leave(props.onClose);
  const generate = async () => {
    if (generationPending.current || props.busy || props.uncertain) return;
    const ticket = ++generation.current;
    generationPending.current = true;
    setConfirmation(undefined);
    setDialogReady(false);
    setGenerating(true);
    setGenerationFailed(false);
    try {
      const password = await props.onGenerate(length, symbols);
      if (!alive.current || ticket !== generation.current) return;
      form.setFieldValue('password', password);
      setDirty(true);
      setGenerated(true);
    } catch {
      if (alive.current && ticket === generation.current)
        setGenerationFailed(true);
    } finally {
      if (alive.current && ticket === generation.current) {
        generationPending.current = false;
        setGenerating(false);
        focusGenerator();
      }
    }
  };
  const closeWizard = () => {
    setWizard(false);
    requestAnimationFrame(() =>
      addButton.current?.querySelector('button')?.focus(),
    );
  };
  const save = async (validated?: Vault.PlainItem) => {
    if (props.uncertain) {
      props.onSave(props.editor.plain, preserveTotp);
      return;
    }
    try {
      const values = validated || (await form.validateFields());
      if (!alive.current) return;
      const plain: Vault.PlainItem = {
        ...props.editor.plain,
        ...values,
        itemSchemaVersion: ITEM_SCHEMA_VERSION,
        itemType: 'LOGIN' as const,
        totp: totp
          ? {
              ...totp,
              issuer: totp.issuer.trim() || values.title,
              accountName: totp.accountName.trim() || values.username || '',
            }
          : null,
        website: normalizeDomain(values.website || ''),
        username: values.username || '',
        password: values.password || '',
        notes: values.notes || '',
        tags: values.tags || [],
      };
      try {
        validatePlain(plain);
        props.onSave(plain, preserveTotp);
      } catch {
        form.setFields([{ name: 'notes', errors: [t('vault.itemRule')] }]);
      }
    } catch {
      /* Form renders field errors. */
    }
  };
  return (
    <>
      {wizard && (
        <TotpImportWizard
          title={title || ''}
          username={username || ''}
          disabled={props.busy || props.uncertain || generating}
          onClose={closeWizard}
          onCode={props.onDraftCode}
          onAdd={(value) => {
            setTotp(value);
            setPreserveTotp(false);
            setDirty(true);
            closeWizard();
          }}
        />
      )}
      <div className={styles.editorContent} hidden={wizard}>
        <Button
          className={styles.back}
          type="link"
          icon={<ArrowLeft size={16} />}
          onClick={close}
        >
          {t('vault.backList')}
        </Button>
        <div className={styles.editorHead}>
          <div>
            <p className={styles.help}>{t('vault.loginAccount')}</p>
            <h2>
              {t(props.editor.itemId ? 'vault.editItem' : 'vault.newItem')}
            </h2>
          </div>
          <Button
            type="text"
            aria-label={t('vault.closeEditor')}
            disabled={props.busy}
            onClick={close}
            icon={<X size={18} />}
          />
        </div>
        {props.groupName && (
          <p className={styles.help}>
            {t('groups.newInGroup', { name: props.groupName })}
          </p>
        )}
        <Form
          id="vault-item-editor"
          form={form}
          layout="vertical"
          preserve={false}
          clearOnDestroy
          autoComplete="off"
          disabled={props.busy || props.uncertain || generating}
          onValuesChange={(changed) => {
            if (Object.hasOwn(changed, 'website')) setSiteChoice(OTHER_SITE);
            setDirty(true);
          }}
          onFinish={(values) => void save(values)}
        >
          <section className={styles.formSection}>
            <Form.Item
              name="title"
              label={t('vault.itemTitle')}
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: t('vault.required'),
                },
              ]}
            >
              <Input maxLength={256} />
            </Form.Item>
            <div className={styles.formGrid}>
              <Form.Item label={t('entries.site')}>
                <div ref={sitePicker}>
                  <Select
                    aria-label={t('entries.site')}
                    aria-description={t('entries.siteSearch')}
                    loading={sites.isFetching}
                    value={selectedSite}
                    placeholder={t(
                      sites.isError
                        ? 'entries.sitesUnavailable'
                        : sites.isPending
                          ? 'entries.sitesLoading'
                          : 'entries.sitePlaceholder',
                    )}
                    prefix={
                      selectedSite === OTHER_SITE ? (
                        <Globe size={16} />
                      ) : (
                        <PanelsTopLeft size={16} />
                      )
                    }
                    open={siteOpen}
                    onOpenChange={(open) => {
                      if (!open && otherFocused.current) return;
                      setSiteOpen(open);
                      if (!open) setSiteSearch('');
                    }}
                    listHeight={256}
                    styles={{
                      popup: { root: { background: 'var(--surface)' } },
                    }}
                    getPopupContainer={(trigger) =>
                      trigger.closest('main') || document.body
                    }
                    options={filteredSites.map((site) => ({
                      value: normalizeDomain(site.siteDomain),
                      label: site.siteName,
                      domain: site.siteDomain,
                    }))}
                    labelRender={() =>
                      selectedSite === OTHER_SITE
                        ? t('entries.otherSite')
                        : matchedSite?.siteName
                    }
                    optionRender={(option) => (
                      <span className={styles.siteOption}>
                        <span className={styles.siteSymbol} aria-hidden>
                          {Array.from(option.data.label)[0]}
                        </span>
                        <span className={styles.siteOptionCopy}>
                          <strong>{option.data.label}</strong>
                          <small>{option.data.domain}</small>
                        </span>
                        {selectedSite === option.value && (
                          <Check size={16} aria-hidden />
                        )}
                      </span>
                    )}
                    showSearch={{
                      filterOption: false,
                      searchValue: siteSearch,
                      onSearch: setSiteSearch,
                    }}
                    notFoundContent={t(
                      sites.isPending
                        ? 'entries.sitesLoading'
                        : sites.isError
                          ? 'entries.sitesUnavailable'
                          : availableSites.length
                            ? 'entries.sitesNoMatch'
                            : 'entries.sitesEmpty',
                    )}
                    onInputKeyDown={(event) => {
                      if (siteOpen && event.key === 'Tab' && !event.shiftKey) {
                        event.preventDefault();
                        otherFocused.current = true;
                        otherButton.current?.focus();
                      }
                    }}
                    popupRender={(menu) => (
                      <div className={styles.sitePopup}>
                        <p className={styles.siteSearchHint}>
                          {t('entries.siteSearch')}
                        </p>
                        {menu}
                        <button
                          ref={otherButton}
                          type="button"
                          disabled={props.busy || props.uncertain || generating}
                          className={styles.otherSite}
                          aria-pressed={selectedSite === OTHER_SITE}
                          onMouseDown={(event) => event.preventDefault()}
                          onBlur={() => {
                            otherFocused.current = false;
                            setSiteOpen(false);
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key === 'Escape' ||
                              (event.key === 'Tab' && event.shiftKey)
                            ) {
                              event.preventDefault();
                              otherFocused.current = false;
                              sitePicker.current
                                ?.querySelector('input')
                                ?.focus();
                              setSiteOpen(event.key !== 'Escape');
                            }
                          }}
                          onClick={() => chooseSite(OTHER_SITE)}
                        >
                          <Globe size={17} aria-hidden />
                          <span className={styles.siteOptionCopy}>
                            <strong>{t('entries.otherSite')}</strong>
                            <small>{t('entries.manualDomain')}</small>
                          </span>
                          {selectedSite === OTHER_SITE && (
                            <Check size={16} aria-hidden />
                          )}
                        </button>
                      </div>
                    )}
                    onChange={chooseSite}
                  />
                </div>
              </Form.Item>
              <Form.Item
                name="website"
                label={
                  <span className="flex items-center gap-2">
                    {t('vault.website')}{' '}
                    <small className={styles.help}>
                      ({t('entries.optional')})
                    </small>
                    {domainReadonly && <LockKeyhole size={14} aria-hidden />}
                  </span>
                }
                extra={t(
                  domainReadonly
                    ? selectedSite
                      ? 'entries.domainSelectedHelp'
                      : 'entries.domainUnsetHelp'
                    : 'entries.domainManualHelp',
                )}
                rules={[
                  {
                    validator: (_, value: string) => {
                      return isDomain(value || '')
                        ? Promise.resolve()
                        : Promise.reject(new Error(t('vault.urlRule')));
                    },
                  },
                ]}
              >
                <Input
                  autoComplete="off"
                  inputMode="url"
                  aria-label={t('vault.website')}
                  readOnly={domainReadonly}
                  placeholder={t(
                    domainReadonly
                      ? 'entries.domainAutoFill'
                      : 'entries.domainPlaceholder',
                  )}
                />
              </Form.Item>
            </div>
            {sites.isError && (
              <div className={styles.siteFailure} role="alert">
                <TriangleAlert size={16} aria-hidden />
                <span>{t('entries.sitesFailed')}</span>
                <Button
                  type="link"
                  loading={sites.isFetching}
                  onClick={() => void sites.refetch()}
                >
                  {t('entries.retrySites')}
                </Button>
              </div>
            )}
            <div className={styles.formGrid}>
              <Form.Item name="username" label={t('vault.username')}>
                <Input autoComplete="off" />
              </Form.Item>
              <Form.Item name="password" label={t('vault.password')}>
                <Input
                  type={visible ? 'text' : 'password'}
                  autoComplete="new-password"
                  suffix={
                    <Button
                      size="small"
                      type="text"
                      aria-label={t(visible ? 'vault.hideNow' : 'vault.reveal')}
                      onClick={() => setVisible(!visible)}
                      icon={visible ? <EyeOff size={16} /> : <Eye size={16} />}
                    />
                  }
                />
              </Form.Item>
            </div>
            <div ref={generatorButton} className={styles.generatorHead}>
              <p className={styles.help}>{t('entries.generatorHint')}</p>
              <Button
                type="link"
                icon={<RefreshCw size={16} />}
                loading={generating}
                disabled={props.busy || props.uncertain || generating}
                onClick={() => {
                  if (props.editor.itemId || form.getFieldValue('password'))
                    setConfirmation('generate');
                  else void generate();
                }}
              >
                {t(
                  generating
                    ? 'actions.generate.pending'
                    : 'vault.generatePassword',
                )}
              </Button>
            </div>
            {generationFailed && (
              <p className={styles.error} role="alert">
                {t('actions.generate.failure')}
              </p>
            )}
            {generated && (
              <p className={styles.help} role="status">
                {t('actions.generate.draftOnly')}
              </p>
            )}
            <details className={styles.advanced}>
              <summary>{t('entries.generatorOptions')}</summary>
              <div className="grid gap-3 py-3">
                <label htmlFor="vault-password-length">
                  {t('vault.passwordLength')} · {length}
                </label>
                <input
                  id="vault-password-length"
                  type="range"
                  min={16}
                  max={48}
                  value={length}
                  disabled={props.busy || props.uncertain || generating}
                  onChange={(event) => setLength(Number(event.target.value))}
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={symbols}
                    disabled={props.busy || props.uncertain || generating}
                    onChange={(event) => setSymbols(event.target.checked)}
                  />
                  {t('vault.includeSymbols')}
                </label>
              </div>
            </details>
          </section>
          <div ref={addButton}>
            <TotpEditor
              hasTotp={!!props.editor.hasTotp}
              info={props.editor.totpInfo}
              disabled={props.busy || props.uncertain}
              value={totp}
              preserve={preserveTotp}
              onImport={() => setWizard(true)}
              onChange={(value, preserve) => {
                setTotp(value);
                setPreserveTotp(preserve);
                setDirty(true);
              }}
            />
          </div>
          <section className={styles.formSection}>
            <div className={styles.formGrid}>
              <Form.Item name="notes" label={t('vault.notes')}>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="tags" label={t('vault.tags')}>
                <Select
                  mode="tags"
                  maxCount={20}
                  tokenSeparators={[',', '，']}
                  options={props.editor.plain.tags.map((tag) => ({
                    value: tag,
                    label: tag,
                  }))}
                />
              </Form.Item>
            </div>
          </section>
        </Form>
        {props.uncertain && (
          <p className={styles.warning} role="status">
            {t('vault.uncertainWrite')}
          </p>
        )}
        {props.conflict && (
          <div className={styles.warning} role="alert">
            <p>{t('vault.conflict')}</p>
            <p>{t('vault.reloadWarning')}</p>
            <Button disabled={props.busy} onClick={() => leave(props.onReload)}>
              {t('vault.reloadItem')}
            </Button>
          </div>
        )}
        <p className={styles.help}>{t('entries.saveHint')}</p>
        <div className={styles.editorFooter}>
          {props.editor.itemId && (
            <Button
              type="text"
              danger
              disabled={props.busy || props.uncertain}
              aria-label={t('vault.delete')}
              onClick={() =>
                props.editor.itemId && props.onDelete(props.editor.itemId)
              }
              icon={<Trash2 size={16} />}
            />
          )}
          <Button disabled={props.busy} onClick={close}>
            {t('vault.cancel')}
          </Button>
          <Button
            type="primary"
            form="vault-item-editor"
            htmlType={props.uncertain ? 'button' : 'submit'}
            loading={props.busy}
            disabled={props.conflict || props.busy || generating}
            onClick={props.uncertain ? () => void save() : undefined}
            icon={<Check size={16} />}
          >
            {t(props.uncertain ? 'vault.retrySave' : 'entries.saveEntry')}
          </Button>
        </div>
      </div>
      {confirmation && (
        <Modal
          open
          modalRender={(node) => (
            <div
              ref={dialog}
              data-vault-dialog-ready={dialogReady || undefined}
              role="presentation"
              onKeyDownCapture={trapDialogTab}
            >
              {node}
            </div>
          )}
          closable={{ 'aria-label': t('entries.closeDialog') }}
          getContainer={false}
          className={styles.dialog}
          destroyOnHidden
          afterOpenChange={setDialogReady}
          focusable={{ trap: true, focusTriggerAfterClose: true }}
          mask={{ closable: false }}
          title={t(
            confirmation === 'generate'
              ? 'actions.generate.title'
              : 'entries.discardTitle',
          )}
          onCancel={() => {
            next.current = undefined;
            setDialogReady(false);
            setConfirmation(undefined);
            if (confirmation === 'generate') focusGenerator();
          }}
          cancelText={t(
            confirmation === 'generate' ? 'vault.cancel' : 'vault.keepEditing',
          )}
          cancelButtonProps={{ autoFocus: true }}
          okText={t(
            confirmation === 'generate'
              ? 'actions.generate.confirm'
              : 'vault.discard',
          )}
          okButtonProps={{
            danger: confirmation === 'discard',
            disabled: props.busy || generating,
          }}
          onOk={() => {
            if (confirmation === 'generate') void generate();
            else next.current?.();
            setDialogReady(false);
            setConfirmation(undefined);
          }}
        >
          {confirmation === 'generate' && (
            <div
              className={`${styles.actionTarget} ${styles.generationTarget}`}
            >
              <TriangleAlert size={22} aria-hidden />
              <span>{title}</span>
            </div>
          )}
          <p
            className={
              confirmation === 'generate' ? styles.generationRisk : undefined
            }
          >
            {t(
              confirmation === 'generate'
                ? 'actions.generate.warning'
                : 'vault.discardConfirm',
            )}
          </p>
        </Modal>
      )}
    </>
  );
}
