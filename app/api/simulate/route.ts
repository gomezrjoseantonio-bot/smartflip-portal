import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { amount, rate } = await req.json();
    if (!amount || !rate) {
      return NextResponse.json({ error: "Missing amount or rate" }, { status: 400 });
    }
    const monthly = (amount * rate) / 100 / 12;
    const annual = (amount * rate) / 100;
    const fiveYear = annual * 5;
    return NextResponse.json({ monthly, annual, fiveYear });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
