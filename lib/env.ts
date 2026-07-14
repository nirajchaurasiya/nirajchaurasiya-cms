import "server-only";
import { z } from "zod";

const optionalUrl = z
  .string()
  .url()
  .optional()
  .or(z.literal(""));

const EnvironmentSchema = z.object({
  MONGODB_URI: z.string().min(1),

  MONGODB_DATABASE: z
    .string()
    .min(1)
    .default("niraj_analytics"),

  AUTH_SECRET: z.string().min(20),

  AUTH_GITHUB_ID: z.string().min(1),

  AUTH_GITHUB_SECRET: z.string().min(1),

  AUTH_ALLOWED_GITHUB_LOGIN: z
    .string()
    .min(1),

  PUBLIC_CONTENT_API_KEY: z
    .string()
    .min(24),

  PUBLIC_INTAKE_SECRET: z
    .string()
    .min(24),

  PUBLIC_SITE_REVALIDATE_URL:
    optionalUrl,

  PUBLIC_SITE_REVALIDATE_SECRET:
    z.string().optional(),
});

export const env =
  EnvironmentSchema.parse({
    MONGODB_URI:
      process.env.MONGODB_URI,

    MONGODB_DATABASE:
      process.env.MONGODB_DATABASE,

    AUTH_SECRET:
      process.env.AUTH_SECRET,

    AUTH_GITHUB_ID:
      process.env.AUTH_GITHUB_ID,

    AUTH_GITHUB_SECRET:
      process.env.AUTH_GITHUB_SECRET,

    AUTH_ALLOWED_GITHUB_LOGIN:
      process.env
        .AUTH_ALLOWED_GITHUB_LOGIN,

    PUBLIC_CONTENT_API_KEY:
      process.env
        .PUBLIC_CONTENT_API_KEY,

    PUBLIC_INTAKE_SECRET:
      process.env.PUBLIC_INTAKE_SECRET,

    PUBLIC_SITE_REVALIDATE_URL:
      process.env
        .PUBLIC_SITE_REVALIDATE_URL,

    PUBLIC_SITE_REVALIDATE_SECRET:
      process.env
        .PUBLIC_SITE_REVALIDATE_SECRET,
  });