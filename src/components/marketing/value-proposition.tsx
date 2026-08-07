import { Zap, Target, Flame } from "lucide-react";

const dimensions = [
  {
    id: "energy",
    name: "Energy",
    weight: "35%",
    description: "Kapasitas fisik dan stamina Anda sepanjang hari. Diukur dari aktivitas, durasi tidur, dan kualitas istirahat.",
    icon: <Zap className="w-6 h-6 text-emerald-400" />,
  },
  {
    id: "focus",
    name: "Focus",
    weight: "35%",
    description: "Ketajaman mental dan konsentrasi. Dievaluasi melalui sesi deep work, pembelajaran, dan minimasi distraksi.",
    icon: <Target className="w-6 h-6 text-emerald-400" />,
  },
  {
    id: "discipline",
    name: "Discipline",
    weight: "30%",
    description: "Konsistensi eksekusi rutinitas. Dinilai dari kepatuhan jadwal, penyelesaian tugas, dan penolakan impuls.",
    icon: <Flame className="w-6 h-6 text-emerald-400" />,
  }
];

export function ValueProposition() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-6 tracking-tight">
            3 Dimensi <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Performa Superior</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            HuMob memecah performa harian Anda ke dalam tiga metrik fundamental yang dikalkulasi secara deterministik.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {dimensions.map((dim) => (
            <div key={dim.id} className="glass-card p-8 group hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="text-9xl font-black font-mono tracking-tighter -mt-10 -mr-6">
                  {dim.name[0]}
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                  {dim.icon}
                </div>
                <div className="font-mono font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-sm">
                  Bobot: {dim.weight}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold font-heading mb-4 relative z-10">{dim.name}</h3>
              <p className="text-muted-foreground leading-relaxed relative z-10">
                {dim.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
