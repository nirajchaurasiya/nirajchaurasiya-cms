import { NextResponse } from "next/server";
import { z } from "zod";

import { dbConnect } from "@/lib/mongodb";
import { safeCompare } from "@/lib/security";

import AuditLogModel from "@/models/AuditLog";
import ContactMessageModel from "@/models/ContactMessage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100),

  email: z
    .string()
    .trim()
    .email()
    .max(180),

  reason: z
    .string()
    .trim()
    .min(2)
    .max(80),

  subject: z
    .string()
    .trim()
    .min(3)
    .max(160),

  message: z
    .string()
    .trim()
    .min(20)
    .max(5_000),

  source: z
    .string()
    .trim()
    .max(120)
    .default("nirajchaurasiya.com"),

  submittedAt: z
    .string()
    .optional(),
});

export async function POST(
  request: Request,
) {
  const authorization =
    request.headers.get("authorization");

  const suppliedSecret =
    authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

  const expectedSecret =
    process.env.PUBLIC_INTAKE_SECRET ?? "";

  if (
    !safeCompare(
      suppliedSecret,
      expectedSecret,
    )
  ) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        message: "The request body must be valid JSON.",
      },
      {
        status: 400,
      },
    );
  }

  const parsed =
    MessageSchema.safeParse(requestBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid message payload",

        errors:
          parsed.error.flatten()
            .fieldErrors,
      },
      {
        status: 400,
      },
    );
  }

  await dbConnect();

  const message =
    await ContactMessageModel.create({
      name: parsed.data.name,
      email: parsed.data.email,
      reason: parsed.data.reason,
      subject: parsed.data.subject,
      message: parsed.data.message,
      source: parsed.data.source,
      status: "NEW",

      metadata: {
        submittedAt:
          parsed.data.submittedAt ?? null,

        userAgent:
          request.headers.get("user-agent"),

        forwardedFor:
          request.headers.get(
            "x-forwarded-for",
          ),

        realIp:
          request.headers.get("x-real-ip"),
      },

      receivedAt: new Date(),
      readAt: null,
      repliedAt: null,
      archivedAt: null,
    });

  await AuditLogModel.create({
    action: "MESSAGE_RECEIVED",
    actorLogin: "public-intake",
    entityType: "ContactMessage",
    entityId: message._id,

    description:
      `Received contact message: ${message.subject}`,
  });

  return NextResponse.json(
    {
      message: "Message received",
      id: message._id.toString(),
    },
    {
      status: 201,
    },
  );
}