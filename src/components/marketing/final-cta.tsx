import { Button } from "@/components/ui/button";
import { ArrowRight, Activity } from "lucide-react";
import Link from "next/link";

export function FinalCta() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-emerald-500/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-[100%]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="glass-card max-w-5xl mx-auto p-12 md:p-20 text-center relative overflow-hidden border-emerald-500/20">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-8 border border-emerald-500/30">
              <Activity className="w-8 h-8 text-emerald-400" />
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold font-heading mb-6 tracking-tight max-w-3xl">
              Berhenti Menebak. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Mulai Mengukur.</span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
              Bergabunglah dengan ribuan profesional yang telah beralih dari habit tracker subjektif ke mesin rating performa deterministik HuMob.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button size="lg" className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold text-lg w-full sm:w-auto">
                Mulai Ukur Gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full font-semibold text-lg border-white/10 hover:bg-white/5 w-full sm:w-auto">
                Lihat Demo Scoring
              </Button>
            </div>
            
            <p className="mt-8 text-sm text-muted-foreground font-mono">
              Tidak perlu kartu kredit. Langsung masuk ke Dashboard.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
