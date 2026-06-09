import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 },
    );
  }

  const user = {
    id: `user-${Date.now()}`,
    displayName: username,
  };

  return NextResponse.json({
    token: `stub-token-${user.id}`,
    user,
  });
}
