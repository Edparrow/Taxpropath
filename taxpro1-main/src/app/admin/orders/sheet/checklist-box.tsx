"use client";

import { useOptimistic, useTransition } from "react";
import { setChecklist } from "../actions";

/** A checklist tick that saves as soon as it's clicked (reverts if the save fails). */
export function ChecklistBox({
  itemId,
  field,
  checked,
  label,
  disabled,
}: {
  itemId: string;
  field: "portal_access_sent" | "certificate_sent";
  checked: boolean;
  label: string;
  disabled: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(checked);
  const [, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={optimistic}
      disabled={disabled}
      onChange={(e) => {
        const next = e.target.checked;
        startTransition(async () => {
          setOptimistic(next);
          const result = await setChecklist(itemId, field, next);
          if (!result.ok) alert(result.message);
        });
      }}
      className="size-4 cursor-pointer accent-brand-600 disabled:cursor-not-allowed"
    />
  );
}
