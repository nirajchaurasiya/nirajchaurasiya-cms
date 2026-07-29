import { type Model, type Types, Schema, model, models } from "mongoose";

export type SocialLinks = {
  github: string;
  linkedin: string;
  x: string;
  youtube: string;
  instagram: string;
};

export interface SiteSettings {
  _id: Types.ObjectId;

  key: "primary";

  cmsName: string;
  publicSiteName: string;
  tagline: string;
  contactEmail: string;
  showEmailPublicly: boolean;

  publicSiteUrl: string;
  publicApiUrl: string;

  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultOgImageUrl: string;

  socials: SocialLinks;

  analyticsRetentionDays: number;

  createdAt: Date;
  updatedAt: Date;
}

const SocialLinksSchema = new Schema<SocialLinks>(
  {
    github: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    linkedin: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    x: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    youtube: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    instagram: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    _id: false,
  },
);

const SiteSettingsSchema = new Schema<SiteSettings>(
  {
    key: {
      type: String,
      enum: ["primary"],
      default: "primary",
      required: true,
      unique: true,
      immutable: true,
    },

    cmsName: {
      type: String,
      default: "Niraj Analytics",
      trim: true,
      maxlength: 80,
    },

    publicSiteName: {
      type: String,
      default: "Niraj Kumar Chaurasiya",
      trim: true,
      maxlength: 120,
    },

    tagline: {
      type: String,
      default: "Building systems under uncertainty",
      trim: true,
      maxlength: 180,
    },

    contactEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      maxlength: 180,
    },

    showEmailPublicly: {
      type: Boolean,
      default: false,
    },

    publicSiteUrl: {
      type: String,
      default: "https://nirajchaurasiya.com",
      trim: true,
      maxlength: 500,
    },

    publicApiUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    defaultSeoTitle: {
      type: String,
      default: "Niraj Kumar Chaurasiya",
      trim: true,
      maxlength: 180,
    },

    defaultSeoDescription: {
      type: String,
      default:
        "Mechanical engineering student building systems across robotics, software, learning, cognition, and uncertainty.",
      trim: true,
      maxlength: 500,
    },

    defaultOgImageUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    socials: {
      type: SocialLinksSchema,
      default: () => ({
        github: "",
        linkedin: "",
        x: "",
        youtube: "",
        instagram: "",
      }),
    },

    analyticsRetentionDays: {
      type: Number,
      default: 365,
      min: 30,
      max: 3650,
    },
  },
  {
    timestamps: true,
    collection: "site_settings",
    minimize: false,
  },
);

const SiteSettingsModel =
  (models.SiteSettings as Model<SiteSettings>) ||
  model<SiteSettings>("SiteSettings", SiteSettingsSchema);

export default SiteSettingsModel;
