import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/decart";

export async function POST() {
  try {
    const client = getServerClient();
    const token = await client.tokens.create();
    return NextResponse.json(token);
  } catch (error) {
    console.error("Decart token error:", error);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
