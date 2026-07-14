import {
  NextResponse,
} from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { safeCompare } from "@/lib/security";
import ContentEntry from "@/models/ContentEntry";
import ContentRelation from "@/models/ContentRelation";

export const runtime =
  "nodejs";

export async function GET(
  request: Request,
) {
  const suppliedKey =
    request.headers.get(
      "x-api-key",
    ) ?? "";

  const expectedKey =
    process.env
      .PUBLIC_CONTENT_API_KEY ??
    "";

  if (
    !safeCompare(
      suppliedKey,
      expectedKey,
    )
  ) {
    return NextResponse.json(
      {
        message:
          "Unauthorized",
      },

      {
        status: 401,
      },
    );
  }

  await dbConnect();

  const entries =
    await ContentEntry.find({
      publicationStatus:
        "PUBLISHED",

      publishedData: {
        $ne: null,
      },
    })
      .sort({
        type: 1,
        publishedAt: -1,
      })
      .lean();

  const entryIds =
    entries.map(
      (entry) =>
        entry._id,
    );

  const relations =
    await ContentRelation.find({
      sourceId: {
        $in: entryIds,
      },
    })
      .sort({
        sortOrder: 1,
      })
      .populate({
        path: "targetId",

        select: {
          type: 1,
          slug: 1,
          title: 1,
          publicPath: 1,
          publicationStatus: 1,
        },
      })
      .lean();

  const relationshipsBySource =
    new Map<
      string,
      unknown[]
    >();

  for (
    const relation
    of relations
  ) {
    const sourceId =
      relation.sourceId.toString();

    const current =
      relationshipsBySource.get(
        sourceId,
      ) ?? [];

    current.push({
      kind:
        relation.relationKind,

      description:
        relation.description,

      target:
        relation.targetId,
    });

    relationshipsBySource.set(
      sourceId,
      current,
    );
  }

  return NextResponse.json({
    generatedAt:
      new Date().toISOString(),

    entries:
      entries.map(
        (entry) => ({
          id:
            entry._id.toString(),

          type:
            entry.type,

          slug:
            entry.slug,

          title:
            entry.title,

          summary:
            entry.summary,

          publicPath:
            entry.publicPath,

          version:
            entry.publishedVersion,

          publishedAt:
            entry.publishedAt,

          updatedAt:
            entry.updatedAt,

          data:
            entry.publishedData,

          relationships:
            relationshipsBySource.get(
              entry._id.toString(),
            ) ?? [],
        }),
      ),
  });
}