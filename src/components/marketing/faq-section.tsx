"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Bagaimana HuMob menjamin privasi data harian saya?",
    answer: "Privasi Anda adalah prioritas absolut kami. Semua data direkam menggunakan enkripsi end-to-end. Rating dan pencapaian Anda secara default bersifat privat (Security Barrier = true). Data hanya dibagikan ke leaderboard jika Anda secara eksplisit mengaktifkan profil publik."
  },
  {
    question: "Apa bedanya HuMob dengan habit tracker biasa?",
    answer: "Habit tracker biasa mengandalkan input 'ya/tidak' yang sangat subjektif (self-bias). HuMob menggunakan kombinasi Deterministic Math dan Groq AI Engine untuk mengkalkulasi skor objektif (0-100) berdasarkan berbagai variabel (durasi, intensitas, waktu) secara real-time dengan latensi <200ms."
  },
  {
    question: "Seberapa akurat AI dalam menilai fokus dan disiplin saya?",
    answer: "Sangat akurat. Groq AI Engine kami dilatih khusus untuk menganalisis pola produktivitas tanpa halusinasi. Kami tidak menggunakan 'AI slop' generik; setiap kalkulasi didasarkan pada model matematis ketat yang membedah aktivitas Anda menjadi data terukur."
  },
  {
    question: "Apakah saya bisa menghubungkan data dari perangkat wearable?",
    answer: "Saat ini, input dilakukan secara manual melalui form super-cepat kami. Namun, integrasi API dengan Apple Health, Oura Ring, dan Garmin sedang dalam tahap pengembangan aktif untuk iterasi berikutnya (HuMob 3.0)."
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-6 tracking-tight">
            Pertanyaan <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Sering Diajukan</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Semua yang perlu Anda ketahui tentang privasi, akurasi AI, dan cara kerja mesin rating kami.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`glass-card overflow-hidden transition-all duration-300 ${openIndex === index ? 'border-emerald-500/30 bg-white/[0.04]' : 'hover:border-white/20'}`}
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-lg pr-8">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-emerald-400' : ''}`}
                />
              </button>
              
              <div 
                className={`px-6 transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
