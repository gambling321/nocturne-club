import { describe, expect, it } from "vitest";
import { clampBet, formatTokens, payoutFor } from "./format";

describe("Token-Hilfsfunktionen", () => {
  it("formatiert ganze Token im deutschen Format", () => {
    expect(formatTokens(1000)).toBe("1.000");
    expect(formatTokens(-4)).toBe("0");
  });

  it("begrenzt Einsätze auf mindestens eins und den Kontostand", () => {
    expect(clampBet(-9, 100)).toBe(1);
    expect(clampBet(999, 100)).toBe(100);
    expect(clampBet(24.7, 100)).toBe(24);
  });

  it("rundet Auszahlungen stets auf ganze virtuelle Tokens ab", () => {
    expect(payoutFor(10, 2.5)).toBe(25);
    expect(payoutFor(11, 1.95)).toBe(21);
    expect(payoutFor(10, 0)).toBe(0);
  });
});
