import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { stage, step, metrics } = body;

  if (!stage || !step || !metrics) {
    return NextResponse.json(
      { error: "stage, step, and metrics are required" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
