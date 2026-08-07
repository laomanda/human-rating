"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Bagaimana HuMob menjamin privasi data harian saya?",
    answer: "Privasi Anda adalah prioritas absolut kami. Semua data direkam menggunakan enkripsi end-to-end. Rating dan pencapaian Anda secara default bersifat privat. Data hanya dibagikan ke papan peringkat publik jika Anda secara eksplisit mengaktifkannya."
  },
  {
    question: "Apa bedanya HuMob dengan habit tracker biasa?",
    answer: "Habit tracker biasa mengandalkan input subjektif (self-bias). HuMob menggunakan kombinasi matematika deterministik dan AI Engine untuk mengkalkulasi skor objektif (0.0 - 10.0) berdasarkan variabel aktivitas fisik, tidur, dan fokus harian secara transparan."
  },
  {
    question: "Seberapa akurat AI dalam menilai fokus dan disiplin saya?",
    answer: "Sangat akurat. AI Engine kami menganalisis pola produktivitas harian secara jujur berdasarkan data terukur yang Anda masukkan, membantu Anda mendeteksi penurunan stamina dan memberikan saran pemulihan fisik yang tepat."
  },
  {
    question: "Apakah saya bisa menghubungkan data dari perangkat wearable?",
    answer: "Saat ini, input dilakukan melalui form cepat harian. Integrasi otomatis dengan Apple Health, Oura Ring, dan Garmin sedang dalam tahap pengujian aktif untuk pembaruan berikutnya."
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-600 dark:text-emerald-400">
            <span>Tanya Jawab (FAQ)</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-foreground">
            Pertanyaan <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">Sering Diajukan</span>
          </h2>
          
          <p className="text-sm sm:text-base text-muted-foreground font-sans leading-relaxed">
            Semua yang perlu Anda ketahui tentang privasi, akurasi kalkulasi, dan cara kerja platform HuMob.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index}
                className={`rounded-2xl border transition-all duration-300 bg-background/90 dark:bg-zinc-950/80 backdrop-blur-xl shadow-md ${
                  isOpen 
                    ? "border-emerald-500/40 shadow-emerald-950/5" 
                    : "border-border/80 hover:border-border"
                }`}
              >
                <button
                  type="button"
                  className="w-full px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between text-left focus:outline-none gap-4"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="font-heading font-bold text-sm sm:text-base text-foreground leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-emerald-500" : ""
                    }`}
                  />
                </button>
                
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100 pb-5 px-5 sm:px-6" : "grid-rows-[0fr] opacity-0 px-5 sm:px-6"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
