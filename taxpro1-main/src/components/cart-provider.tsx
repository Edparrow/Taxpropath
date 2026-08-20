"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartLine } from "@/lib/types";

const STORAGE_KEY = "taxpropath.cart";
const EMPTY: CartLine[] = [];

// useSyncExternalStore requires getSnapshot to return a stable reference
// until the store actually changes, so the parsed array is cached here
// rather than re-parsed (and re-allocated) on every render.
let cached: CartLine[] = EMPTY;
let cachedRaw: string | null = null;

function getSnapshot(): CartLine[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    cached = raw ? JSON.parse(raw) : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * Writes through to localStorage and fires a synthetic "storage" event so
 * every subscriber — including this same tab — re-renders immediately.
 * (Native `storage` events only fire in *other* tabs.)
 */
function writeLines(lines: CartLine[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("storage"));
}

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  addLine: (line: CartLine) => void;
  removeLine: (optionId: string) => void;
  setQuantity: (optionId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addLine = useCallback((line: CartLine) => {
    const prev = getSnapshot();
    const existing = prev.find((l) => l.optionId === line.optionId);
    writeLines(
      existing
        ? prev.map((l) =>
            l.optionId === line.optionId
              ? { ...l, quantity: l.quantity + line.quantity }
              : l,
          )
        : [...prev, line],
    );
  }, []);

  const removeLine = useCallback((optionId: string) => {
    writeLines(getSnapshot().filter((l) => l.optionId !== optionId));
  }, []);

  const setQuantity = useCallback((optionId: string, quantity: number) => {
    const prev = getSnapshot();
    writeLines(
      quantity <= 0
        ? prev.filter((l) => l.optionId !== optionId)
        : prev.map((l) => (l.optionId === optionId ? { ...l, quantity } : l)),
    );
  }, []);

  const clear = useCallback(() => writeLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotalCents: lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0),
      addLine,
      removeLine,
      setQuantity,
      clear,
    }),
    [lines, addLine, removeLine, setQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
