"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";

import AuditLogModel from "@/models/AuditLog";
import SiteSettingsModel from "@/models/SiteSettings";

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const OptionalUrlSchema = z.union([z.literal(""), z.string().url().max(500)]);

const OptionalEmailSchema = z.union([
  z.literal(""),
  z.string().email().max(180),
]);

const SettingsSchema = z.object({
  cmsName: z.string().min(2).max(80),

  publicSiteName: z.string().min(2).max(120),

  tagline: z.string().max(180),

  contactEmail: OptionalEmailSchema,

  showEmailPublicly: z.boolean(),

  publicSiteUrl: OptionalUrlSchema,

  publicApiUrl: OptionalUrlSchema,

  defaultSeoTitle: z.string().max(180),

  defaultSeoDescription: z.string().max(500),

  defaultOgImageUrl: OptionalUrlSchema,

  github: OptionalUrlSchema,
  linkedin: OptionalUrlSchema,
  x: OptionalUrlSchema,
  youtube: OptionalUrlSchema,
  instagram: OptionalUrlSchema,

  analyticsRetentionDays: z.coerce.number().int().min(30).max(3650),
});

function readFormValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function updateSiteSettingsAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await requireOwner();

  try {
    const parsed = SettingsSchema.parse({
      cmsName: readFormValue(formData, "cmsName"),

      publicSiteName: readFormValue(formData, "publicSiteName"),

      tagline: readFormValue(formData, "tagline"),

      contactEmail: readFormValue(formData, "contactEmail"),

      showEmailPublicly: formData.get("showEmailPublicly") === "on",

      publicSiteUrl: readFormValue(formData, "publicSiteUrl"),

      publicApiUrl: readFormValue(formData, "publicApiUrl"),

      defaultSeoTitle: readFormValue(formData, "defaultSeoTitle"),

      defaultSeoDescription: readFormValue(formData, "defaultSeoDescription"),

      defaultOgImageUrl: readFormValue(formData, "defaultOgImageUrl"),

      github: readFormValue(formData, "github"),

      linkedin: readFormValue(formData, "linkedin"),

      x: readFormValue(formData, "x"),

      youtube: readFormValue(formData, "youtube"),

      instagram: readFormValue(formData, "instagram"),

      analyticsRetentionDays: readFormValue(formData, "analyticsRetentionDays"),
    });

    await dbConnect();

    const settings = await SiteSettingsModel.findOneAndUpdate(
      {
        key: "primary",
      },

      {
        $set: {
          cmsName: parsed.cmsName,

          publicSiteName: parsed.publicSiteName,

          tagline: parsed.tagline,

          contactEmail: parsed.contactEmail,

          showEmailPublicly: parsed.showEmailPublicly,

          publicSiteUrl: parsed.publicSiteUrl,

          publicApiUrl: parsed.publicApiUrl,

          defaultSeoTitle: parsed.defaultSeoTitle,

          defaultSeoDescription: parsed.defaultSeoDescription,

          defaultOgImageUrl: parsed.defaultOgImageUrl,

          socials: {
            github: parsed.github,

            linkedin: parsed.linkedin,

            x: parsed.x,

            youtube: parsed.youtube,

            instagram: parsed.instagram,
          },

          analyticsRetentionDays: parsed.analyticsRetentionDays,
        },

        $setOnInsert: {
          key: "primary",
        },
      },

      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    await AuditLogModel.create({
      action: "SETTING_CHANGED",

      actorLogin: session.user.githubLogin,

      entityType: "SiteSettings",

      entityId: settings._id,

      description: "Updated the primary CMS and public-site settings.",
    });

    revalidatePath("/dashboard/settings");

    revalidatePath("/dashboard");

    return {
      status: "success",
      message: "Settings saved successfully.",
    };
  } catch (error) {
    return {
      status: "error",

      message:
        error instanceof Error
          ? error.message
          : "The settings could not be saved.",
    };
  }
}
