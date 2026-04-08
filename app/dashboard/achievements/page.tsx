"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import Navbar from "@/app/components/Navbar";
import Badge from "@/app/components/Badge";
import LevelBadge from "@/app/components/LevelBadge";
import { Trophy, Loader2 } from "lucide-react";

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  recently_unlocked?: boolean;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "1", icon: "🌱", title: "Primer Paso", description: "Realiza tu primera inversión", unlocked: false, progress: 0 },
  { id: "2", icon: "💰", title: "Inversor Activo", description: "Acumula 1.000€ en ganancias", unlocked: false, progress: 0 },
  { id: "3", icon: "📈", title: "Racha Ganadora", description: "Recibe cobros 6 meses seguidos", unlocked: false, progress: 0 },
  { id: "4", icon: "🏆", title: "Rentabilista", description: "Alcanza 5.000€ en ganancias", unlocked: false, progress: 0 },
  { id: "5", icon: "💎", title: "Inversor Élite", description: "Acumula 10.000€ en ganancias", unlocked: false, progress: 0 },
  { id: "6", icon: "🎯", title: "Meta Cumplida", description: "Completa tu primera meta", unlocked: false, progress: 0 },
  { id: "7", icon: "🔥", title: "En Racha", description: "12 meses consecutivos con cobros", unlocked: false, progress: 0 },
  { id: "8", icon: "🌟", title: "Cartera Diversificada", description: "Invierte en 3 préstamos distintos", unlocked: false, progress: 0 },
];

export default function AchievementsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        setUserEmail(user.email || "");

        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const [achRes, statsRes] = await Promise.all([
          fetch("/api/achievements", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          fetch("/api/stats", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        ]);

        if (achRes.ok) {
          const data = await achRes.json();
          if (data.achievements?.length > 0) setAchievements(data.achievements);
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          setTotalEarned(data.totalEarnings || 0);
        }
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 size={32} className="text-[#4ECDC4] animate-spin" />
      </div>
    );
  }

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Navbar userEmail={userEmail} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy size={24} className="text-[#4ECDC4]" />
              Logros y Nivel
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Tu progreso como inversor en SmartFlip</p>
          </div>

          {/* Level badge */}
          <div className="mb-8 max-w-sm">
            <LevelBadge totalEarned={totalEarned} />
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#4ECDC4]">{unlocked.length}</div>
              <div className="text-xs text-slate-400 mt-1">Logros desbloqueados</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{achievements.length}</div>
              <div className="text-xs text-slate-400 mt-1">Total de logros</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#2ECC71]">
                {achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Completado</div>
            </div>
          </div>

          {/* Unlocked achievements */}
          {unlocked.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white font-semibold mb-4">Desbloqueados ✨</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {unlocked.map((a) => (
                  <Badge
                    key={a.id}
                    icon={a.icon}
                    title={a.title}
                    description={a.description}
                    unlocked={true}
                    recentlyUnlocked={a.recently_unlocked}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Locked achievements */}
          {locked.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-4">Por desbloquear 🔒</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {locked.map((a) => (
                  <Badge
                    key={a.id}
                    icon={a.icon}
                    title={a.title}
                    description={a.description}
                    unlocked={false}
                    progress={a.progress}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
