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
  type PlainItem = {
    itemSchemaVersion: 2;
    title: string;
    website: string;
    username: string;
    password: string;
    notes: string;
    tags: string[];
    totp: Totp | null;
  };
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
  type Summary = Pick<PlainItem, 'title' | 'website' | 'username' | 'tags'> & {
    hasTotp: boolean;
    hasPassword: boolean;
    totpInfo: TotpInfo | null;
    itemId: string;
    rowVersion: number;
    contentVersion: number;
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
