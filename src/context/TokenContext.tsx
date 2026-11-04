import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

interface TokenContextValue {
  balance: number;
  placeBet: (amount: number) => boolean;
  credit: (amount: number) => void;
}

const TokenContext = createContext<TokenContextValue | undefined>(undefined);

/** In-memory only: a full browser reload always reconstructs this at 1,000. */
export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(1000);
  // The ref makes the check-and-debit synchronous, so two rapid input events
  // can never reserve the same virtual tokens before React renders again.
  const balanceRef = useRef(1000);

  const placeBet = useCallback((amount: number) => {
    const safeAmount = Math.floor(amount);
    if (!Number.isFinite(safeAmount) || safeAmount < 1) return false;

    if (safeAmount > balanceRef.current) return false;
    balanceRef.current -= safeAmount;
    setBalance(balanceRef.current);
    return true;
  }, []);

  const credit = useCallback((amount: number) => {
    const safeAmount = Math.floor(amount);
    if (!Number.isFinite(safeAmount) || safeAmount <= 0) return;
    balanceRef.current += safeAmount;
    setBalance(balanceRef.current);
  }, []);

  const value = useMemo(() => ({ balance, placeBet, credit }), [balance, placeBet, credit]);
  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
}

export function useTokens(): TokenContextValue {
  const value = useContext(TokenContext);
  if (!value) throw new Error("useTokens muss innerhalb von TokenProvider verwendet werden.");
  return value;
}
