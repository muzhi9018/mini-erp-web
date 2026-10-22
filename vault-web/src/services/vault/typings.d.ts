declare namespace Vault {
  type Box = {
    formatVersion: 1;
    algorithm: 'A256GCM';
    iv: string;
    ciphertext: string;
  };
  type Slot = {
    slotId: string;
    slotType: 'NORMAL' | 'RECOVERY';
    keyId: string;
    kdfProfile: string | null;
    kdfSalt: string | null;
    wrapSalt: string | null;
    recoverySalt: string | null;
    wrappedVmk: Box;
  };
  type Session = {
    loginMethod: 'LOCAL_PASSKEY';
    csrfToken: string;
    csrfHeader: string;
    ownerSubject?: string;
    stage?: 'PASSWORD' | 'MFA' | 'RECOVERY_ENROLLMENT' | 'RECOVERY_SETUP';
    mfa?: boolean;
    recentAuthentication?: boolean;
    credentialRevision?: number;
    recoveryRequired?: boolean;
  };
  type RecoveryCodes = {
    formatVersion: 1;
    ownerSubject: string;
    batchId: string;
    codes: string[];
    credentialRevision: number;
  };
  type Passkey = {
    credentialId: string;
    label: string;
    lastUsedAt: string | null;
  };
  type Context = { ownerSubject: string; vaultId: string; keyEpoch: number };
  type Meta = {
    initialized: boolean;
    lifecycleProtocolVersion?: number;
    clientLifecycleVersionHeader?: string;
    deletedItemRetentionDays?: number;
    metaRevision: number;
    collectionRevision: number;
    vaultId?: string;
    status?: 'ACTIVE' | 'EMPTY' | 'RESTORING';
    generation?: number;
    keyEpoch?: number;
    keySlots?: Slot[];
    allowedFormatVersions: number[];
    allowedAlgorithms: string[];
    allowedKdfProfiles: string[];
    readableItemSchemaVersions: number[];
    writeItemSchemaVersion: number;
    clientSchemaVersionHeader: string;
    minimumClientSchemaVersion: number;
  };
  type Item = {
    itemId: string;
    contentVersion: number;
    rowVersion: number;
    keyEpoch: number;
    wrappedDek: Box;
    encryptedItem: Box;
  };
  type ItemPage = {
    generation: number;
    collectionRevision: number;
    items: Item[];
    nextCursor?: string | null;
  };
  type DeletedItem = Item & {
    deleted: true;
    deletedAt: string;
    purgeAt: string;
  };
  type DeletedSummary = Summary & Pick<DeletedItem, 'deletedAt' | 'purgeAt'>;
  type DeletedPage = ItemPage & {
    serverTime: string;
    items: DeletedItem[];
    nextCursor: string | null;
  };
  type DeletedDetail = DeletedItem & {
    generation: number;
    collectionRevision: number;
    serverTime: string;
  };
  type DeleteReceipt = WriteReceipt & {
    deleted: true;
    contentVersion: number;
    deletedAt: string;
    purgeAt: string;
    serverTime: string;
  };
  type LifecycleRequest = {
    itemId: string;
    generation: number;
    expectedRowVersion: number;
    idempotencyKey: string;
  };
  type LifecycleReceipt = {
    itemId: string;
    collectionRevision: number;
    serverTime: string;
    deleted?: false;
    rowVersion?: number;
    contentVersion?: number;
    permanentlyDeleted?: true;
    purgedAt?: string;
  };
  type RotationItem = Item & {
    deleted?: boolean;
    deletedAt?: string | null;
    purgeAt?: string | null;
  };
  type PlainItem = {
    itemSchemaVersion: 3;
    itemType: 'LOGIN';
    title: string;
    website: string;
    username: string;
    password: string;
    notes: string;
    tags: string[];
    totp: Totp | null;
    platform: string | null;
    boundEmail: string | null;
    emailItemId: string | null;
  };
  type PlainGroup = {
    itemSchemaVersion: 3;
    itemType: 'ACCOUNT_GROUP';
    name: string;
    defaultBoundEmail?: string | null;
    memberItemIds: string[];
  };
  type PlainRecord = PlainItem | PlainGroup;
  type Totp = {
    secretBase32: string;
    issuer: string;
    accountName: string;
    algorithm: 'SHA1' | 'SHA256' | 'SHA512';
    digits: 6 | 8;
    period: 30 | 60;
  };
  type TotpCode = { code: string; validFrom: number; validUntil: number };
  type TotpInfo = Omit<Totp, 'secretBase32'>;
  type Summary = Pick<
    PlainItem,
    | 'title'
    | 'website'
    | 'username'
    | 'tags'
    | 'platform'
    | 'boundEmail'
    | 'emailItemId'
    | 'itemType'
  > & {
    hasTotp: boolean;
    hasPassword: boolean;
    totpInfo: TotpInfo | null;
    itemId: string;
    rowVersion: number;
    contentVersion: number;
  };
  type GroupSummary = PlainGroup & {
    itemId: string;
    rowVersion: number;
    contentVersion: number;
  };
  type RecordChange = {
    itemId?: string;
    plain: PlainRecord;
    preserveTotp?: boolean;
  };
  type BatchChange = {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DELETE_GROUP';
    itemId: string;
    expectedRowVersion: number | null;
    contentVersion: number | null;
    wrappedDek: Box | null;
    encryptedItem: Box | null;
  };
  type ItemBatch = {
    generation: number;
    keyEpoch: number;
    expectedCollectionRevision: number;
    changes: BatchChange[];
    idempotencyKey: string;
  };
  type BatchReceipt = {
    generation: number;
    collectionRevision: number;
    results: (Partial<WriteReceipt> & {
      itemId: string;
      collectionRevision: number;
      contentVersion?: number;
      deleted?: boolean;
      permanentlyDeleted?: boolean;
      deletedAt?: string;
      purgeAt?: string;
      serverTime?: string;
      purgedAt?: string;
    })[];
  };
  type AccountFile = {
    formatVersion: 1;
    vaultId: string;
    ownerSubject: string;
    accountKeyId: string;
    accountKey: string;
  };
  type RecoveryFile = {
    formatVersion: 1;
    vaultId: string;
    ownerSubject: string;
    recoveryKeyId: string;
    recoveryKey: string;
  };
  type PreparedSetup = {
    vaultId: string;
    keySlots: Slot[];
    accountFile: string;
    recoveryFile: string;
  };
  type ItemWrite = Omit<Item, 'rowVersion'> & {
    generation: number;
    expectedRowVersion?: number;
    idempotencyKey: string;
  };
  type WriteReceipt = {
    itemId: string;
    rowVersion: number;
    collectionRevision: number;
  };
  type Snapshot = Meta & { ownerSubject: string; items: Item[] };
  type Backup = {
    formatVersion: 1;
    backupId: string;
    backupSalt: string;
    snapshot: Snapshot;
    manifest: string;
    authentication: string;
  };
  type RotationStart = {
    rotationId: string;
    vaultId: string;
    expectedMetaRevision: number;
    expectedCollectionRevision: number;
    keySlots: Slot[];
    itemIds?: string[];
    idempotencyKey: string;
  };
  type Rotation = {
    rotationId: string;
    status: 'UPLOADING' | 'COMMITTED' | 'CANCELLED' | 'EXPIRED';
    generation: number;
    keyEpoch: number;
    expectedCollectionRevision: number;
    expectedItemCount: number;
    expiresAt: string;
    mode: 'ROTATION' | 'RESTORE';
    keySlots: Slot[];
    expectedItems: { itemId: string; contentVersion: number }[];
    receivedBatchIds: string[];
    commitReceipt: RotationReceipt | null;
  };
  type RotationReceipt = {
    rotationId: string;
    generation: number;
    keyEpoch: number;
    metaRevision: number;
    collectionRevision: number;
  };
  type RotationSummary = Pick<
    Rotation,
    | 'rotationId'
    | 'status'
    | 'generation'
    | 'keyEpoch'
    | 'expectedCollectionRevision'
    | 'expectedItemCount'
    | 'expiresAt'
  >;
  type RotationCommand = {
    rotationId: string;
    idempotencyKey: string;
    expectedCollectionRevision?: number;
    verifiedManifestDigest?: string;
  };
  type Credential = {
    id: string;
    rawId: string;
    type: 'public-key';
    response: {
      clientDataJSON: string;
      attestationObject?: string;
      transports?: string[];
      authenticatorData?: string;
      signature?: string;
      userHandle?: string | null;
    };
  };
  type RegistrationOptions = Omit<
    PublicKeyCredentialCreationOptions,
    'challenge' | 'user' | 'excludeCredentials'
  > & {
    challenge: string;
    user: Omit<PublicKeyCredentialUserEntity, 'id'> & { id: string };
    excludeCredentials: { id: string; type: 'public-key' }[];
  };
  type AuthenticationOptions = Omit<
    PublicKeyCredentialRequestOptions,
    'challenge' | 'allowCredentials'
  > & {
    challenge: string;
    allowCredentials: { id: string; type: 'public-key' }[];
  };
}
