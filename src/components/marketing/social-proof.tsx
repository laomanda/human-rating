import { Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    content: "HuMob telah mengubah cara saya melihat produktivitas. Dulu saya hanya menebak seberapa produktif saya, sekarang saya punya metrik objektif yang membimbing keputusan harian saya.",
    author: "Elena Rodriguez",
    role: "Senior Product Designer",
    score: "94.2",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026701d"
  },
  {
    id: 2,
    content: "Tidak ada lagi self-bias. Angka tidak bisa berbohong. AI engine-nya sangat akurat dalam mendeteksi pola penurunan fokus saya di sore hari.",
    author: "Marcus Chen",
    role: "Founding Engineer",
    score: "96.8",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026702d"
  },
  {
    id: 3,
    content: "Awalnya saya skeptis dengan 'Deterministic Math', tapi setelah 2 minggu menggunakan HuMob, saya sadar rutinitas pagi saya sangat mempengaruhi skor energi seharian.",
    author: "Aisha Patel",
    role: "Marketing Director",
    score: "91.5",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026703d"
  }
];

export function SocialProof() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-6 tracking-tight">
            Dipercaya oleh <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">High Performers</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Jangan hanya percaya kata-kata kami. Lihat bagaimana HuMob mengubah cara profesional top mengelola performa harian mereka.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testi) => (
            <div key={testi.id} className="glass-card p-8 flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300">
              <div>
                <Quote className="w-8 h-8 text-emerald-500/20 mb-6 group-hover:text-emerald-500/40 transition-colors" />
                <p className="text-muted-foreground leading-relaxed mb-8">
                  "{testi.content}"
                </p>
              </div>
              
              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <img 
                  src={testi.avatar} 
                  alt={testi.author} 
                  className="w-12 h-12 rounded-full border border-white/10"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{testi.author}</div>
                  <div className="text-xs text-muted-foreground truncate">{testi.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Avg Score</div>
                  <div className="font-mono font-bold text-emerald-400">{testi.score}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
