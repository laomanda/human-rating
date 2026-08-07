import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const leaderboardData = [
  {
    rank: 1,
    name: "Alex R.",
    role: "Software Engineer",
    score: 98.5,
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    status: "Elite"
  },
  {
    rank: 2,
    name: "Sarah M.",
    role: "Product Manager",
    score: 95.2,
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    status: "Top 1%"
  },
  {
    rank: 3,
    name: "David K.",
    role: "Designer",
    score: 92.8,
    avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d",
    status: "Top 5%"
  }
];

export function CommunityPreview() {
  return (
    <section className="py-24 relative overflow-hidden bg-white/5">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              Community Leaderboard
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-heading tracking-tight">
              Bergabung dengan <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Top 1% Performers</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              Lihat bagaimana performa harian Anda dibandingkan dengan komunitas profesional global yang menggunakan HuMob untuk mengoptimalkan hari mereka.
            </p>
          </div>

          <div className="flex-1 w-full max-w-md">
            <div className="glass-card p-6 flex flex-col gap-4 relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-lg">Global Top Performers</h3>
                <span className="text-xs text-muted-foreground font-mono">Live Update</span>
              </div>

              {leaderboardData.map((user) => (
                <div key={user.rank} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-8 text-center font-mono font-bold text-lg text-muted-foreground">
                    #{user.rank}
                  </div>
                  
                  <Avatar className="w-10 h-10 border border-emerald-500/20">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.role}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400">{user.score}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{user.status}</div>
                  </div>
                </div>
              ))}
              
              <div className="mt-4 text-center">
                <div className="text-sm text-muted-foreground">
                  +10,000 active users today
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
