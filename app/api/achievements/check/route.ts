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

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getServiceClient();
    const { newly_unlocked } = await req.json().catch(() => ({ newly_unlocked: [] }));

    const newAchievements: string[] = [];

    for (const achievementId of (newly_unlocked || [])) {
      const { error } = await supabase
        .from("investor_achievements")
        .upsert({ user_id: user.id, achievement_id: achievementId, unlocked_at: new Date().toISOString() });
      if (!error) newAchievements.push(achievementId);
    }

    return NextResponse.json({ newly_unlocked: newAchievements });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
