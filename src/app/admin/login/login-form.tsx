"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { loginAction } from "@/server/auth/actions";
import type { FormState } from "@/server/auth/types";

const initialState: FormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <Field
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="username"
        required
        maxLength={254}
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        maxLength={256}
      />

      {state.error ? (
        <p role="alert" className="text-sm font-semibold text-ink">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Memeriksa..." : "Masuk"}
      </Button>
    </form>
  );
}
