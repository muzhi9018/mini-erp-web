export function readAutoLockConfig(env: NodeJS.ProcessEnv) {
  const production = env.NODE_ENV === 'production';

  function duration(name: string, fallback: number, milliseconds: number) {
    const value = env[name]?.trim();
    if (!value) return fallback;
    const amount = Number(value);
    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      !Number.isSafeInteger(amount * milliseconds)
    )
      throw new Error(
        `${name} must be a positive integer with a safe duration`,
      );
    return amount;
  }

  return {
    idleMinutes: duration(
      'VAULT_IDLE_LOCK_MINUTES',
      production ? 5 : 1,
      60_000,
    ),
    backgroundSeconds: duration(
      'VAULT_BACKGROUND_LOCK_SECONDS',
      production ? 60 : 20,
      1_000,
    ),
  };
}
