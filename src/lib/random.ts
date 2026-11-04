/** Browser-side randomness without persistence or server calls. */
export function secureInt(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new Error("Ungültiger Zufallsbereich.");
  }

  const span = max - min + 1;
  const cutoff = Math.floor(0x1_0000_0000 / span) * span;
  const values = new Uint32Array(1);
  let value = 0;

  do {
    crypto.getRandomValues(values);
    value = values[0];
  } while (value >= cutoff);

  return min + (value % span);
}

export function securePick<T>(items: readonly T[]): T {
  if (!items.length) throw new Error("Leere Auswahl.");
  return items[secureInt(0, items.length - 1)]!;
}

export function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = secureInt(0, index);
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}
