"use client";

import { LeaderboardPodium } from "@/components/ui/leaderboard-podium";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getScoreColorStyle } from "@/components/marketing/bento-features";

const topRankings = [
  {
    userId: "1",
    userName: "Alex R.",
    role: "Software Engineer",
    rank: 1,
    value: 9.8,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    status: "Peringkat 1",
  },
  {
    userId: "2",
    userName: "Sarah M.",
    role: "Product Manager",
    rank: 2,
    value: 9.5,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    status: "Top 1%",
  },
  {
    userId: "3",
    userName: "David K.",
    role: "Product Designer",
    rank: 3,
    value: 9.2,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    status: "Top 5%",
  },
];

const runnerUpRankings = [
  {
    userId: "4",
    userName: "Michael B.",
    role: "Data Scientist",
    rank: 4,
    value: 8.9,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    status: "Top 5%",
  },
  {
    userId: "5",
    userName: "Elena V.",
    role: "AI Researcher",
    rank: 5,
    value: 8.7,
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
    status: "Top 10%",
  },
  {
    userId: "6",
    userName: "Rizky P.",
    role: "Frontend Lead",
    rank: 6,
    value: 8.5,
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80",
    status: "Top 10%",
  },
];

export function CommunityPreview() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-center justify-between">
          
          {/* Left Column: Headline & Description */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-foreground leading-[1.15]">
              Bergabung dengan <br />
              <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                1% Pengguna Teratas
              </span>
            </h2>
            
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans max-w-xl mx-auto lg:mx-0">
              Bandingkan konsistensi performa harianmu secara objektif dengan komunitas profesional yang mengoptimalkan rutinitas mereka setiap hari.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 font-mono text-xs text-muted-foreground">
              <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>+10,000 Pengguna Aktif</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2 shadow-sm">
                <span>Determinasi 100% Valid</span>
              </div>
            </div>
          </div>

          {/* Right Column: Leaderboard Podium & Top Performers Card */}
          <div className="flex-1 w-full max-w-lg">
            <div className="rounded-3xl border border-border/80 bg-background/90 dark:bg-zinc-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/10 dark:shadow-emerald-950/20 space-y-8 relative overflow-hidden">
              
              {/* Podium Top 3 Interactive Display */}
              <div className="pt-2">
                <LeaderboardPodium
                  rankings={topRankings}
                  size="default"
                  medalStyle="modern"
                />
              </div>

              {/* List View of Ranks 4, 5, 6 */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                {runnerUpRankings.map((user) => (
                  <div 
                    key={user.userId} 
                    className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl bg-card border border-border/60 hover:border-emerald-500/30 transition-all duration-300 shadow-sm"
                  >
                    <div className="w-7 text-center font-mono font-bold text-sm text-muted-foreground">
                      #{user.rank}
                    </div>
                    
                    <Avatar className="w-10 h-10 border border-border/80">
                      <AvatarImage src={user.avatarUrl} alt={user.userName} />
                      <AvatarFallback className="font-mono font-bold">{user.userName[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-bold text-sm text-foreground truncate">{user.userName}</div>
                      <div className="text-xs text-muted-foreground truncate font-sans">{user.role}</div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className={`px-2.5 py-0.5 rounded-md border text-xs font-mono font-extrabold tabular-nums ${getScoreColorStyle(user.value)}`}>
                        {user.value.toFixed(1)} / 10.0
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">{user.status}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
