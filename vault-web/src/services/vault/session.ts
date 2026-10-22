import { assert } from '@/security/vault/protocol';
import { doGet, doPost, updateCSRF } from '@/services/httpClient';

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
