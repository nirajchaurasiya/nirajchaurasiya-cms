import { z } from "zod";
import {
  contentTypes,
  type ContentType,
  type JsonObject,
} from "@/types/content";

export const ContentEditorSchema = z.object({
  id: z.string().optional(),

  expectedDraftVersion: z.coerce
    .number()
    .int()
    .positive()
    .optional(),

  type: z.enum(contentTypes),

  slug: z
    .string()
    .trim()
    .min(2, "The slug is too short.")
    .max(160, "The slug is too long.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens.",
    ),

  title: z
    .string()
    .trim()
    .min(2, "A title is required.")
    .max(240),

  summary: z
    .string()
    .trim()
    .max(1_200),

  publicPath: z
    .string()
    .trim()
    .max(300)
    .optional(),

  featured: z.boolean(),

  draftData: z.string().min(2),
});

export type ParsedContentInput = {
  id?: string;
  expectedDraftVersion?: number;

  type: ContentType;
  slug: string;
  title: string;
  summary: string;
  publicPath: string | null;
  featured: boolean;

  draftData: JsonObject;
};

function parseJsonObject(value: string): JsonObject {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(
      "The structured content could not be converted into valid JSON.",
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      "The content data must be a JSON object.",
    );
  }

  return parsed as JsonObject;
}

export function parseContentForm(
  formData: FormData,
): ParsedContentInput {
  const result = ContentEditorSchema.safeParse({
    id: formData.get("id") || undefined,

    expectedDraftVersion:
      formData.get("expectedDraftVersion") ||
      undefined,

    type: formData.get("type"),

    slug: formData.get("slug"),

    title: formData.get("title"),

    summary: formData.get("summary") ?? "",

    publicPath:
      formData.get("publicPath") || undefined,

    featured:
      formData.get("featured") === "on",

    draftData: formData.get("draftData"),
  });

  if (!result.success) {
    throw new Error(
      result.error.issues
        .map((issue) => issue.message)
        .join(" "),
    );
  }

  return {
    ...result.data,

    publicPath:
      result.data.publicPath?.trim() || null,

    draftData: parseJsonObject(
      result.data.draftData,
    ),
  };
}