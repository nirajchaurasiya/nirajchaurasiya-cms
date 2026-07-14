import {
  NextResponse,
} from "next/server";

import { dbConnect } from "@/lib/mongodb";
import { safeCompare } from "@/lib/security";

import ContentEntryModel from "@/models/ContentEntry";
import ContentRelationModel from "@/models/ContentRelation";

import {
  contentTypes,
  type ContentType,
} from "@/types/content";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type PublicEntry = {
  _id: {
    toString(): string;
  };

  type: string;
  slug: string;
  title: string;
  summary: string;
  publicPath: string | null;
  featured: boolean;
  publishedData: unknown;
  publishedVersion: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

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

  const url =
    new URL(request.url);

  const rawType =
    url.searchParams
      .get("type")
      ?.trim()
      .toUpperCase();

  const requestedSlug =
    url.searchParams
      .get("slug")
      ?.trim()
      .toLowerCase();

  let requestedType:
    | ContentType
    | null = null;

  if (rawType) {
    if (
      !contentTypes.includes(
        rawType as ContentType,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid content type.",
        },

        {
          status: 400,
        },
      );
    }

    requestedType =
      rawType as ContentType;
  }

  await dbConnect();

  const query:
    Record<string, unknown> = {
    publicationStatus:
      "PUBLISHED",

    publishedData: {
      $ne: null,
    },
  };

  if (requestedType) {
    query.type =
      requestedType;
  }

  if (requestedSlug) {
    query.slug =
      requestedSlug;
  }

  const entries =
    await ContentEntryModel.find(
      query,
    )
      .select({
        type: 1,
        slug: 1,
        title: 1,
        summary: 1,
        publicPath: 1,
        featured: 1,
        publishedData: 1,
        publishedVersion: 1,
        publishedAt: 1,
        updatedAt: 1,
      })
      .sort({
        featured: -1,
        publishedAt: -1,
      })
      .lean();

  const publicEntries =
    entries as PublicEntry[];

  const publicEntryIds =
    publicEntries.map(
      (entry) => entry._id,
    );

  const entryMap =
    new Map(
      publicEntries.map(
        (entry) => [
          entry._id.toString(),
          entry,
        ],
      ),
    );

  const relationships =
    publicEntryIds.length > 0
      ? await ContentRelationModel.find({
          sourceId: {
            $in: publicEntryIds,
          },

          targetId: {
            $in: publicEntryIds,
          },
        })
          .sort({
            sourceId: 1,
            sortOrder: 1,
            createdAt: 1,
          })
          .lean()
      : [];

  const relationshipsBySource =
    new Map<
      string,
      Array<{
        id: string;
        kind: string;
        description:
          | string
          | null;
        sortOrder: number;
        target: {
          id: string;
          type: string;
          slug: string;
          title: string;
          publicPath:
            | string
            | null;
        };
      }>
    >();

  for (
    const relationship
    of relationships
  ) {
    const sourceId =
      relationship.sourceId.toString();

    const targetId =
      relationship.targetId.toString();

    const target =
      entryMap.get(targetId);

    if (!target) {
      continue;
    }

    const existing =
      relationshipsBySource.get(
        sourceId,
      ) ?? [];

    existing.push({
      id:
        relationship._id.toString(),

      kind:
        relationship.relationKind,

      description:
        relationship.description ??
        null,

      sortOrder:
        relationship.sortOrder,

      target: {
        id: targetId,
        type:
          target.type,
        slug:
          target.slug,
        title:
          target.title,
        publicPath:
          target.publicPath,
      },
    });

    relationshipsBySource.set(
      sourceId,
      existing,
    );
  }

  const response =
    NextResponse.json({
      generatedAt:
        new Date().toISOString(),

      count:
        publicEntries.length,

      entries:
        publicEntries.map(
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

            featured:
              entry.featured,

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

  response.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0",
  );

  return response;
}