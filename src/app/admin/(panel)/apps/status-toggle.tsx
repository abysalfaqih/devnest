"use client";

import { useActionState } from "react";
import { rowActionClass } from "@/components/admin/row-action";
import { setStatusAction } from "@/server/apps/actions";
import type { ActionResult } from "@/server/apps/types";

const initialState: ActionResult = {};

export function StatusToggle({ id, status }: { id: string; status: "draft" | "published" }) {
  const [state, formAction, pending] = useActionState(setStatusAction, initialState);
  const next = status === "published" ? "draft" : "published";

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={next} />
      <button type="submit" disabled={pending} className={rowActionClass}>
        {status === "published" ? "Jadikan draf" : "Terbitkan"}
      </button>
      {state.error ? (
        <p role="alert" className="mt-1.5 max-w-52 text-sm font-semibold text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
