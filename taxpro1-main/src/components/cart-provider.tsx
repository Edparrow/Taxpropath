"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cartLineTotalCents, type CartLine } from "@/lib/types";
import { CartSync } from "@/components/cart-sync";

const STORAGE_KEY = "taxpropath.cart";
const EMPTY: CartLine[] = [];

// useSyncExternalStore requires getSnapshot to return a stable reference
// until the store actually changes, so the parsed array is cached here
// rather than re-parsed (and re-allocated) on every render.
let cached: CartLine[] = EMPTY;
let cachedRaw: string | null = null;

/** Carts saved by older versions of the site have a different shape — drop them. */
function isCartLine(value: unknown): value is CartLine {
  const line = value as CartLine;
  return (
    typeof line?.courseSlug === "string" &&
    typeof line.basePriceCents === "number" &&
    Array.isArray(line.addons)
  );
}

function getSnapshot(): CartLine[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : EMPTY;
    cached = Array.isArray(parsed) ? parsed.filter(isCartLine) : EMPTY;
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
  removeLine: (courseSlug: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // One line per course: re-adding replaces it, so a new add-on choice wins.
  const addLine = useCallback((line: CartLine) => {
    const rest = getSnapshot().filter((l) => l.courseSlug !== line.courseSlug);
    writeLines([...rest, line]);
  }, []);

  const removeLine = useCallback((courseSlug: string) => {
    writeLines(getSnapshot().filter((l) => l.courseSlug !== courseSlug));
  }, []);

  const clear = useCallback(() => writeLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount: lines.length,
      subtotalCents: lines.reduce((sum, l) => sum + cartLineTotalCents(l), 0),
      addLine,
      removeLine,
      clear,
    }),
    [lines, addLine, removeLine, clear],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartSync lines={lines} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
