import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/admin/auth-layout";
import { getAdminState } from "@/server/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

// Membaca sesi pada setiap request, jadi tidak bisa dirender lebih dulu dan tidak perlu
// navigasi instan. Tanpa baris ini Next.js 16 mencatat galat "uncached data" di mode dev.
export const instant = false;

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
