import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: "User account was not found." }, { status: 404 });
    }
    if (currentUser.organizationId) {
      return NextResponse.json({ error: "Your account already belongs to an organization." }, { status: 409 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const name = body && typeof body === "object" && "name" in body && typeof body.name === "string"
      ? body.name.trim()
      : "";

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required." },
        { status: 400 }
      );
    }

    const organization = await prisma.$transaction(async (transaction) => {
      const created = await transaction.organization.create({ data: { name } });
      await transaction.user.update({
        where: { id: session.user.id },
        data: { organizationId: created.id, role: "ADMIN" },
      });
      return created;
    });

    return NextResponse.json(
      {
        message: "Organization created successfully.",
        organization,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Organization creation error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}