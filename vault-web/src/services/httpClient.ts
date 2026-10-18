import { getLocale, request } from '@umijs/max';

let csrf: { token: string; header: string } | undefined;
let sessionEpoch = 0;
let dataWritesBlocked = false;

export function blockDataWrites() {
  dataWritesBlocked = true;
}

export class VaultHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
  ) {
    super(code);
    this.name = 'VaultHttpError';
  }
}

export function clearSession() {
  csrf = undefined;
  sessionEpoch++;
}

export function invalidateResponses() {
  sessionEpoch++;
}

export function updateCSRF(session: Vault.Session) {
  if (
    typeof session.csrfToken !== 'string' ||
    !session.csrfToken ||
    !/^X-[A-Za-z0-9-]+$/i.test(session.csrfHeader)
  )
    throw new VaultHttpError(400, 'VAULT_INVALID_FORMAT');
  csrf = { token: session.csrfToken, header: session.csrfHeader };
}

type Envelope<T> = {
  success: boolean;
  code: number;
  data: T;
  message?: string;
};
type Failure = { errorCode?: string; requestId?: string };

async function send<T>(
  url: string,
  method: 'GET' | 'POST',
  data?: unknown,
  params?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const epoch = sessionEpoch;
  if (!url.startsWith('/vault-auth/') && !url.startsWith('/api/v1/vault/'))
    throw new VaultHttpError(400, 'VAULT_INVALID_REQUEST');
  if (
    method === 'POST' &&
    url.startsWith('/api/v1/vault/') &&
    dataWritesBlocked
  )
    throw new VaultHttpError(409, 'VAULT_CLIENT_UPGRADE_REQUIRED');
  if (method === 'POST' && !csrf)
    throw new VaultHttpError(403, 'VAULT_CSRF_INVALID');
  try {
    const response = await request<Envelope<T>>(url, {
      method,
      data,
      params,
      signal,
      withCredentials: true,
      skipErrorHandler: true,
      headers: {
        'Accept-Language': getLocale(),
        ...(method === 'POST' && url.startsWith('/api/v1/vault/')
          ? { 'X-Vault-Item-Schema-Version': '2' }
          : {}),
        ...(method === 'POST' && csrf ? { [csrf.header]: csrf.token } : {}),
      },
    });
    if (epoch !== sessionEpoch) throw new VaultHttpError(401, 'VAULT_LOCKED');
    if (response?.success !== true || response.code !== 200) {
      const failure = response?.data as Failure | undefined;
      throw new VaultHttpError(
        response?.code || 500,
        failure?.errorCode || 'VAULT_REQUEST_FAILED',
        failure?.requestId,
      );
    }
    return response.data;
  } catch (error) {
    const raw = error as {
      response?: { status?: number; data?: Envelope<Failure> };
    };
    const failure = raw.response?.data?.data;
    const safe =
      error instanceof VaultHttpError
        ? error
        : new VaultHttpError(
            raw.response?.status || 0,
            failure?.errorCode || 'VAULT_REQUEST_FAILED',
            failure?.requestId,
          );
    if (safe.code === 'VAULT_CLIENT_UPGRADE_REQUIRED') blockDataWrites();
    if (
      safe.status === 401 &&
      safe.code !== 'VAULT_INVALID_CREDENTIALS' &&
      epoch === sessionEpoch
    ) {
      clearSession();
      window.dispatchEvent(new Event('vault-session-ended'));
    }
    throw safe;
  }
}

export const doGet = <T>(
  url: string,
  params?: Record<string, unknown>,
  signal?: AbortSignal,
) => send<T>(url, 'GET', undefined, params, signal);
export const doPost = <T>(url: string, data: unknown) =>
  send<T>(url, 'POST', data);
