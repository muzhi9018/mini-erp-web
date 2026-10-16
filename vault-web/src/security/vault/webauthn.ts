import { assert, decode, encode } from './protocol';

function credential(value: Credential | null): PublicKeyCredential {
  assert(value instanceof PublicKeyCredential && value.type === 'public-key');
  return value;
}

export async function createPasskey(
  options: Vault.RegistrationOptions,
): Promise<Vault.Credential> {
  const key = credential(
    await navigator.credentials.create({
      publicKey: {
        ...options,
        challenge: decode(options.challenge, 16, 128),
        user: { ...options.user, id: decode(options.user.id, 32) },
        excludeCredentials: options.excludeCredentials.map((entry) => ({
          ...entry,
          id: decode(entry.id, 1, 1024),
        })),
      },
    }),
  );
  const response = key.response as AuthenticatorAttestationResponse;
  return {
    id: key.id,
    rawId: encode(new Uint8Array(key.rawId)),
    type: 'public-key',
    response: {
      clientDataJSON: encode(new Uint8Array(response.clientDataJSON)),
      attestationObject: encode(new Uint8Array(response.attestationObject)),
      transports: response.getTransports?.() || [],
    },
  };
}

export async function getPasskey(
  options: Vault.AuthenticationOptions,
): Promise<Vault.Credential> {
  const key = credential(
    await navigator.credentials.get({
      publicKey: {
        ...options,
        challenge: decode(options.challenge, 16, 128),
        allowCredentials: options.allowCredentials.map((entry) => ({
          ...entry,
          id: decode(entry.id, 1, 1024),
        })),
      },
    }),
  );
  const response = key.response as AuthenticatorAssertionResponse;
  return {
    id: key.id,
    rawId: encode(new Uint8Array(key.rawId)),
    type: 'public-key',
    response: {
      clientDataJSON: encode(new Uint8Array(response.clientDataJSON)),
      authenticatorData: encode(new Uint8Array(response.authenticatorData)),
      signature: encode(new Uint8Array(response.signature)),
      userHandle: response.userHandle
        ? encode(new Uint8Array(response.userHandle))
        : null,
    },
  };
}
