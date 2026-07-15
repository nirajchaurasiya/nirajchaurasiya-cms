import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/mongodb";
import { safeCompare } from "@/lib/security";

import ContactMessageModel from "@/models/ContactMessage";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const messageSchema = z.object({
  name: z.string().trim().min(2).max(100),

  email: z.string().trim().email().max(200),

  subject: z.string().trim().min(3).max(160),

  message: z.string().trim().min(20).max(5_000),

  sourcePath: z.string().trim().max(300).optional().default("/contact"),
});

function readBearerSecret(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function hashValue(value: string) {
  if (!value) {
    return null;
  }

  const secret =
    process.env.ANALYTICS_HASH_SECRET?.trim() ??
    process.env.PUBLIC_INTAKE_SECRET?.trim() ??
    "";

  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.PUBLIC_INTAKE_SECRET?.trim() ?? "";

    const headerSecret = request.headers.get("x-intake-secret")?.trim() ?? "";

    const bearerSecret = readBearerSecret(request);

    const authorized =
      expectedSecret.length > 0 &&
      (safeCompare(headerSecret, expectedSecret) ||
        safeCompare(bearerSecret, expectedSecret));

    if (!authorized) {
      return NextResponse.json(
        {
          message: "Unauthorized message intake.",
        },
        {
          status: 401,
        },
      );
    }

    const rawBody: unknown = await request.json();

    const parsed = messageSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message ?? "Invalid message.",
          issues: parsed.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";

    const ipAddress = forwardedFor.split(",")[0]?.trim() ?? "";

    const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? "";

    await dbConnect();

    const contactMessage = await ContactMessageModel.create({
      name: parsed.data.name,

      email: parsed.data.email,

      subject: parsed.data.subject,

      reason: parsed.data.subject || "Website contact form",

      message: parsed.data.message,

      sourcePath: parsed.data.sourcePath,

      status: "NEW",

      ipHash: hashValue(ipAddress),

      userAgent,

      receivedAt: new Date(),
    });

    console.log("CONTACT MESSAGE SAVED", {
      id: String(contactMessage._id),

      database: contactMessage.db.name,

      collection: contactMessage.collection.name,

      status: contactMessage.status,

      subject: contactMessage.subject,
    });

    /*
     * The message was created by an external
     * API request, so explicitly invalidate
     * authenticated dashboard pages.
     */
    revalidatePath("/dashboard/messages");

    revalidatePath("/dashboard");

    return NextResponse.json(
      {
        message: "Your message was received.",

        received: true,

        id: contactMessage._id.toString(),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Public message intake failed:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Message intake failed.",
      },
      {
        status: 500,
      },
    );
  }
}
