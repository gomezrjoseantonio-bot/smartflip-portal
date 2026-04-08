import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

async function getUserFromRequest(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await getServiceClient().auth.getUser(token);
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getServiceClient();

    const { data: definitions } = await supabase
      .from("achievement_definitions")
      .select("*")
      .order("sort_order", { ascending: true });

    const { data: unlocked } = await supabase
      .from("investor_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", user.id);

    const unlockedIds = new Set((unlocked || []).map((u: any) => u.achievement_id));
    const unlockedMap = new Map((unlocked || []).map((u: any) => [u.achievement_id, u.unlocked_at]));
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const achievements = (definitions || []).map((d: any) => ({
      id: d.id,
      icon: d.icon,
      title: d.title,
      description: d.description,
      unlocked: unlockedIds.has(d.id),
      progress: unlockedIds.has(d.id) ? 100 : 0,
      recently_unlocked: unlockedIds.has(d.id) && new Date(unlockedMap.get(d.id)) > weekAgo,
    }));

    return NextResponse.json({ achievements });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
