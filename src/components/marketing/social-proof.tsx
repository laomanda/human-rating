"use client";

import { motion } from "framer-motion";
import { TestimonialsColumn, TestimonialItem } from "@/components/ui/testimonials-columns-1";

const testimonials: TestimonialItem[] = [
  {
    text: "HuMob telah mengubah cara saya melihat produktivitas. Dulu saya hanya menebak seberapa produktif saya, sekarang saya punya metrik objektif yang membimbing keputusan harian.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    name: "Elena Rodriguez",
    role: "Senior Product Designer",
    score: "9.4",
  },
  {
    text: "Tidak ada lagi self-bias. Angka tidak bisa berbohong. AI engine-nya sangat akurat dalam mendeteksi pola penurunan fokus saya di sore hari.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    name: "Marcus Chen",
    role: "Founding Engineer",
    score: "9.6",
  },
  {
    text: "Awalnya saya skeptis dengan 'Deterministic Math', tapi setelah 2 minggu menggunakan HuMob, saya sadar rutinitas pagi saya sangat mempengaruhi skor energi seharian.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    name: "Aisha Patel",
    role: "Marketing Director",
    score: "9.1",
  },
  {
    text: "Melihat grafik konsistensi 30 hari secara transparan membuat tim engineering kami jauh lebih disiplin menjaga jam tidur dan stamina.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    name: "Briana Patton",
    role: "Operations Lead",
    score: "9.5",
  },
  {
    text: "Algoritma rating tanpa bias ini sangat membantu saya mengevaluasi batas kelelahan fisik sebelum mengambil sesi latihan gym malam.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80",
    name: "Farhan Siddiqui",
    role: "Tech Founder",
    score: "9.3",
  },
  {
    text: "Fitur simulasi rating harian sangat interaktif. Saya bisa melihat dampak pasti dari begadang 2 jam terhadap energi esok hari.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
    name: "Zainab Hussain",
    role: "Project Manager",
    score: "9.2",
  },
  {
    text: "Tracking performa 0.0 - 10.0 memberikan kepuasan tersendiri saat berhasil menjaga streak di atas 9.0 selama 3 minggu berturut-turut.",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80",
    name: "Omar Raza",
    role: "Product Strategist",
    score: "9.7",
  },
  {
    text: "Responsiveness dan kemudahan akses di mobile maupun desktop membuat pelaporan aktivitas harian terasa effortless.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80",
    name: "Sana Sheikh",
    role: "UX Researcher",
    score: "9.0",
  },
  {
    text: "Integrasi antara kalkulasi deterministik dan saran AI membuat saran pemulihan fisik terasa sangat personal dan relevan.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80",
    name: "Hassan Ali",
    role: "Engineering Manager",
    score: "9.8",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export function SocialProof() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12 space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-600 dark:text-emerald-400">
            <span>Testimonial Komunitas</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-foreground">
            Dipercaya oleh <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">High Performers</span>
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground font-sans leading-relaxed">
            Jangan hanya percaya kata-kata kami. Lihat bagaimana HuMob mengubah cara profesional top mengelola performa harian mereka.
          </p>
        </motion.div>

        {/* Animated Infinite Testimonials Columns */}
        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[640px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>

      </div>
    </section>
  );
}
