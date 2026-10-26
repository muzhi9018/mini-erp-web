import { assert, encoder } from '@/security/vault/protocol';
import {
  doGet,
  doPost,
  updateCSRF,
  VaultHttpError,
} from '@/services/httpClient';

const prefix = '/vault/auth';
async function sessionResponse(promise: Promise<Vault.Session>) {
  const session = await promise;
  if (session.loginMethod !== 'LOCAL_PASSKEY')
    throw new Error('VAULT_INVALID_FORMAT');
  assert(
    session.stage === undefined ||
      ['PASSWORD', 'MFA', 'RECOVERY_ENROLLMENT', 'RECOVERY_SETUP'].includes(
        session.stage,
      ),
  );
  if (session.stage)
    assert(
      typeof session.ownerSubject === 'string' &&
        session.ownerSubject.length > 0 &&
        session.ownerSubject.length <= 128 &&
        session.mfa === (session.stage === 'MFA'),
    );
  updateCSRF(session);
  return session;
}
export const options = () =>
  sessionResponse(doGet<Vault.Session>(`${prefix}/options`));
export const login = (username: string, password: string) =>
  sessionResponse(
    doPost<Vault.Session>(`${prefix}/login`, { username, password }),
  );
export const authenticateOptions = () =>
  doPost<Vault.AuthenticationOptions>(
    `${prefix}/passkeys/authenticate/options`,
    {},
  );
export const operationOptions = (
  value: Vault.DeleteOperation,
  signal: AbortSignal,
) => {
  const path = {
    DELETE_ITEM: 'delete-item',
    PURGE_ITEM: 'purge-item',
    DELETE_GROUP: 'delete-group',
    BATCH_ITEMS: 'batch-items',
  }[value.operation];
  if (
    encoder.encode(JSON.stringify(value.request)).length >
    (value.operation === 'BATCH_ITEMS' ? 1024 * 1024 : 64 * 1024)
  )
    throw new VaultHttpError(400, 'VAULT_BATCH_TOO_LARGE');
  return doPost<Vault.OperationOptions>(
    `${prefix}/passkeys/operations/${path}/options`,
    value.request,
    signal,
  );
};
export const authenticate = (credential: Vault.Credential) =>
  sessionResponse(
    doPost<Vault.Session>(`${prefix}/passkeys/authenticate/verify`, credential),
  );
export const registerOptions = () =>
  doPost<Vault.RegistrationOptions>(`${prefix}/passkeys/register/options`, {});
export const register = (label: string, credential: Vault.Credential) =>
  doPost<boolean>(`${prefix}/passkeys/register/verify`, { label, credential });
export const issueCodes = (expectedCredentialRevision: number) =>
  doPost<Vault.RecoveryCodes>(`${prefix}/recovery-codes/issue`, {
    expectedCredentialRevision,
  });
export const confirmCodes = (
  batchId: string,
  expectedCredentialRevision: number,
) =>
  sessionResponse(
    doPost<Vault.Session>(`${prefix}/recovery-codes/confirm`, {
      batchId,
      expectedCredentialRevision,
    }),
  );
export const recoverMFA = (code: string) =>
  sessionResponse(
    doPost<Vault.Session>(`${prefix}/mfa-recovery/verify`, { code }),
  );
export const logout = () => doPost<boolean>(`${prefix}/logout`, {});
export const passkeys = () => doGet<Vault.Passkey[]>(`${prefix}/passkeys`);
export const revoke = (
  credentialId: string,
  expectedCredentialRevision: number,
) =>
  doPost<boolean>(`${prefix}/passkeys/revoke`, {
    credentialId,
    expectedCredentialRevision,
  });
