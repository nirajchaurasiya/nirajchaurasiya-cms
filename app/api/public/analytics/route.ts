import {
  NextResponse,
} from "next/server";
import { z } from "zod";

import {
  detectDeviceType,
  hashAnalyticsSession,
  readCountryCode,
} from "@/lib/analytics";
import { dbConnect } from "@/lib/mongodb";
import { safeCompare } from "@/lib/security";

import AnalyticsEventModel, {
  analyticsEventNames,
} from "@/models/AnalyticsEvent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AnalyticsPayloadSchema =
  z.object({
    eventName:
      z.enum(analyticsEventNames),

    path:
      z
        .string()
        .trim()
        .max(500)
        .optional(),

    targetUrl:
      z
        .string()
        .trim()
        .max(2_000)
        .optional(),

    referrer:
      z
        .string()
        .trim()
        .max(2_000)
        .optional(),

    sessionId:
      z
        .string()
        .trim()
        .min(8)
        .max(200),

    metadata:
      z
        .record(
          z.string(),
          z.unknown(),
        )
        .optional(),
  });

export async function POST(
  request: Request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  const suppliedSecret =
    authorization?.startsWith(
      "Bearer ",
    )
      ? authorization.slice(7)
      : "";

  const expectedSecret =
    process.env
      .PUBLIC_ANALYTICS_SECRET ??
    "";

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

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        message:
          "The request body must be valid JSON.",
      },
      {
        status: 400,
      },
    );
  }

  const parsed =
    AnalyticsPayloadSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          "Invalid analytics payload.",

        errors:
          parsed.error.flatten()
            .fieldErrors,
      },
      {
        status: 400,
      },
    );
  }

  const userAgent =
    request.headers.get(
      "user-agent",
    ) ?? "";

  await dbConnect();

  await AnalyticsEventModel.create({
    eventName:
      parsed.data.eventName,

    path:
      parsed.data.path ?? null,

    targetUrl:
      parsed.data.targetUrl ??
      null,

    referrer:
      parsed.data.referrer ??
      null,

    sessionHash:
      hashAnalyticsSession(
        parsed.data.sessionId,
      ),

    country:
      readCountryCode(
        request.headers,
      ),

    deviceType:
      detectDeviceType(
        userAgent,
      ),

    metadata:
      parsed.data.metadata ?? null,

    occurredAt: new Date(),
  });

  return NextResponse.json(
    {
      received: true,
    },
    {
      status: 201,
    },
  );
}