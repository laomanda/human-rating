import { Cta4 } from "@/components/ui/cta-4";

export function FinalCta() {
  return (
    <Cta4
      title="Berhenti Menebak. Mulai Mengukur."
      description="Bergabunglah dengan ribuan profesional yang beralih dari habit tracker subjektif ke mesin rating performa deterministik HuMob."
      buttonText="Mulai Gratis Sekarang"
      buttonUrl="/dashboard"
      items={[
        "Integrasi Mudah 0.0 - 10.0 Rating",
        "Kalkulasi Deterministik Tanpa Bias",
        "Rekomendasi Pemulihan Fisik AI",
        "Skalabilitas & Privasi Terjamin",
        "Ribuan Pengguna Komunitas Aktif",
      ]}
    />
  );
}
