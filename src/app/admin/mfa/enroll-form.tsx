"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startMfaEnrollmentAction, verifyMfaAction } from "@/server/auth/actions";
import type { FormState } from "@/server/auth/types";
import { CodeField } from "./code-field";

type Setup = { factorId: string; qr: string; secret: string };

const initialState: FormState = {};

/** Kunci setup dipecah per 4 karakter agar mudah diketik manual. */
function groupSecret(secret: string) {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

export function EnrollForm() {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, startTransition] = useTransition();
  const [state, formAction, verifying] = useActionState(verifyMfaAction, initialState);

  function start() {
    setStartError(null);
    startTransition(async () => {
      const result = await startMfaEnrollmentAction();
      if ("error" in result) setStartError(result.error);
      else setSetup(result);
    });
  }

  if (!setup) {
    return (
      <div className="space-y-4">
        <Button type="button" onClick={start} disabled={starting} className="w-full">
          {starting ? "Menyiapkan..." : "Mulai pengaturan"}
        </Button>
        {startError ? (
          <p role="alert" className="text-sm font-semibold text-ink">
            {startError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
        <li>Buka aplikasi authenticator, pilih tambah akun.</li>
        <li>Pindai kode QR di bawah, atau ketik kunci setup secara manual.</li>
        <li>Masukkan 6 digit yang muncul, lalu tekan Aktifkan.</li>
      </ol>

      {/* eslint-disable-next-line @next/next/no-img-element -- SVG data URI dari Supabase, bukan gambar yang bisa dioptimasi */}
      <img
        src={setup.qr}
        alt="Kode QR untuk aplikasi authenticator"
        width={176}
        height={176}
        className="mx-auto size-44 rounded-xl bg-white p-2"
      />

      <div>
        <p className="text-sm font-semibold">Kunci setup manual</p>
        <p className="mt-1 font-mono text-sm break-all text-muted select-all">
          {groupSecret(setup.secret)}
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="factorId" value={setup.factorId} />
        <CodeField />

        {state.error ? (
          <p role="alert" className="text-sm font-semibold text-ink">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={verifying} className="w-full">
          {verifying ? "Memeriksa..." : "Aktifkan"}
        </Button>
      </form>

      <p className="text-sm text-muted">
        Jika perangkat authenticator hilang, akses dipulihkan lewat dashboard Supabase (hapus faktor
        MFA akun Anda di Authentication, lalu Users).
      </p>
    </div>
  );
}
