export const TOKEN_CHIPS = [1, 5, 10, 25, 50, 100] as const;

export function formatTokens(value: number): string {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(
    Math.max(0, Math.floor(value)),
  );
}

export function clampBet(value: number, balance: number): number {
  return Math.max(1, Math.min(Math.floor(value) || 1, Math.floor(balance)));
}

export function payoutFor(stake: number, multiplier: number): number {
  return Math.max(0, Math.floor(stake * multiplier));
}

export const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
