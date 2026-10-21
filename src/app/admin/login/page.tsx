import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/admin/auth-layout";
import { getAdminState } from "@/server/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage() {
  const state = await getAdminState();
  if (state.status === "ok") redirect("/admin");
  if (state.status === "mfa-enroll" || state.status === "mfa-verify") redirect("/admin/mfa");

  return (
    <AuthLayout title="Masuk admin" description="Khusus pemilik Devnest.">
      <LoginForm />
    </AuthLayout>
  );
}
