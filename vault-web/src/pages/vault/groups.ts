export const emptyItem = (): Vault.PlainItem => ({
  itemSchemaVersion: 3,
  itemType: 'LOGIN',
  title: '',
  website: '',
  username: '',
  password: '',
  notes: '',
  tags: [],
  totp: null,
  platform: null,
  boundEmail: null,
  emailItemId: null,
});

export type GroupEditorDraft = {
  itemId: string;
  group: Vault.PlainGroup;
  isNew: boolean;
};

export const groupDraft = (): GroupEditorDraft => ({
  itemId: crypto.randomUUID(),
  isNew: true,
  group: {
    itemSchemaVersion: 3,
    itemType: 'ACCOUNT_GROUP',
    name: '',
    memberItemIds: [],
  },
});

export const groupPlain = (group: Vault.GroupSummary): Vault.PlainGroup => ({
  itemSchemaVersion: 3,
  itemType: 'ACCOUNT_GROUP',
  name: group.name,
  memberItemIds: group.memberItemIds,
});
