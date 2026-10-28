"use client";

import { rowActionClass } from "@/components/admin/row-action";
import { deleteAppAction } from "@/server/apps/actions";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteAppAction}
      onSubmit={(event) => {
        if (!window.confirm(`Hapus "${name}"? Aplikasi akan disembunyikan dari situs.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={rowActionClass}>
        Hapus
      </button>
    </form>
  );
}
