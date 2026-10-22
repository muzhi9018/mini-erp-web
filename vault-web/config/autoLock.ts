export function readAutoLockConfig(env: NodeJS.ProcessEnv) {
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
    idleMinutes: duration('VAULT_IDLE_LOCK_MINUTES', 5, 60_000),
    backgroundSeconds: duration('VAULT_BACKGROUND_LOCK_SECONDS', 60, 1_000),
  };
}
