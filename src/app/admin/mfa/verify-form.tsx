"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { verifyMfaAction } from "@/server/auth/actions";
import type { FormState } from "@/server/auth/types";
import { CodeField } from "./code-field";

const initialState: FormState = {};

export function VerifyForm() {
  const [state, formAction, pending] = useActionState(verifyMfaAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <CodeField />

      {state.error ? (
        <p role="alert" className="text-sm font-semibold text-ink">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Memeriksa..." : "Verifikasi"}
      </Button>
    </form>
  );
}
