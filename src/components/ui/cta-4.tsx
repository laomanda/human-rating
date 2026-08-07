import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Cta4Props {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  items?: string[];
}

const defaultItems = [
  "Integrasi Mudah 0.0 - 10.0 Rating",
  "Kalkulasi Deterministik Tanpa Bias",
  "Rekomendasi Pemulihan Fisik AI",
  "Skalabilitas & Privasi Terjamin",
  "Ribuan Pengguna Komunitas Aktif",
];

export const Cta4 = ({
  title = "Berhenti Menebak. Mulai Mengukur.",
  description = "Bergabunglah dengan ribuan profesional yang beralih dari habit tracker subjektif ke mesin rating performa deterministik HuMob.",
  buttonText = "Mulai Gratis Sekarang",
  buttonUrl = "/dashboard",
  items = defaultItems,
}: Cta4Props) => {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="w-full max-w-5xl">
            <div className="flex flex-col items-start justify-between gap-8 rounded-3xl border border-border/80 bg-background/90 dark:bg-zinc-950/80 backdrop-blur-xl px-6 py-10 md:flex-row lg:px-16 lg:py-14 shadow-2xl shadow-black/5 dark:shadow-emerald-950/10 transition-all duration-300 hover:border-emerald-500/30">
              
              {/* Left Column */}
              <div className="md:w-1/2 space-y-4">
                <h3 className="font-heading text-2xl font-bold md:text-3xl lg:text-4xl text-foreground leading-tight">
                  {title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground font-sans leading-relaxed">
                  {description}
                </p>
                <div className="pt-2">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl h-12 px-6" asChild>
                    <a href={buttonUrl}>
                      <span>{buttonText}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Right Column List */}
              <div className="w-full md:w-5/12 border-t border-border/60 pt-6 md:border-t-0 md:pt-0 md:border-l md:border-border/60 md:pl-8">
                <ul className="flex flex-col space-y-3.5 text-xs sm:text-sm font-sans font-medium text-foreground">
                  {items.map((item, idx) => (
                    <li className="flex items-center gap-3" key={idx}>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
