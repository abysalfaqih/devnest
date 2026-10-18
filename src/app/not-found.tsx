import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="py-24 text-center sm:py-32">
      <p className="font-display text-7xl font-bold tracking-tight text-brand sm:text-8xl">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
        Halaman tidak ditemukan
      </h1>
      <p className="mx-auto mt-2 max-w-md text-muted">
        Alamat yang Anda buka tidak ada atau sudah dipindahkan.
      </p>
      <div className="mt-8">
        <ButtonLink href="/">Kembali ke beranda</ButtonLink>
      </div>
    </Container>
  );
}
