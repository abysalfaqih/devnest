import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/admin/auth-layout";
import { logoutAction } from "@/server/auth/actions";
import { getAdminState } from "@/server/auth/session";
import { EnrollForm } from "./enroll-form";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verifikasi dua langkah" };

export default async function MfaPage() {
  const state = await getAdminState();
  if (state.status === "anonymous" || state.status === "not-admin") redirect("/admin/login");
  if (state.status === "ok") redirect("/admin");

  const enrolling = state.status === "mfa-enroll";

  return (
    <AuthLayout
      title={enrolling ? "Aktifkan verifikasi dua langkah" : "Verifikasi dua langkah"}
      description={
        enrolling
          ? "Panel admin wajib memakai aplikasi authenticator (Google Authenticator, Authy, 1Password, dan sejenisnya)."
          : "Masukkan 6 digit dari aplikasi authenticator Anda."
      }
    >
      {enrolling ? <EnrollForm /> : <VerifyForm />}

      <form action={logoutAction} className="mt-8">
        <button type="submit" className="text-sm text-muted underline underline-offset-4">
          Keluar dan masuk dengan akun lain
        </button>
      </form>
    </AuthLayout>
  );
}
