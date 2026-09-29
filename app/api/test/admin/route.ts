import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authorization";

export async function GET() {
  try {
    const user = await requireRole(["ADMIN"]);

    return NextResponse.json({
      message: "Admin access granted.",
      user: user.email,
      role: user.role,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }
}