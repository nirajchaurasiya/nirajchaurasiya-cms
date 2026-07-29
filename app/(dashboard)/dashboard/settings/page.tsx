import { Database, ExternalLink, KeyRound, Settings2 } from "lucide-react";

import type { Metadata } from "next";

import SiteSettingsForm, {
  type SiteSettingsFormValues,
} from "@/components/dashboard/SiteSettingsForm";

import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";

import SiteSettingsModel, { type SiteSettings } from "@/models/SiteSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings | Niraj Analytics",
};

const defaultValues: SiteSettingsFormValues = {
  cmsName: "Niraj Analytics",

  publicSiteName: "Niraj Kumar Chaurasiya",

  tagline: "Building systems under uncertainty",

  contactEmail: "",

  showEmailPublicly: false,

  publicSiteUrl: "https://nirajchaurasiya.com",

  publicApiUrl: "",

  defaultSeoTitle: "Niraj Kumar Chaurasiya",

  defaultSeoDescription:
    "Mechanical engineering student building systems across robotics, software, learning, cognition, and uncertainty.",

  defaultOgImageUrl: "",

  github: "",
  linkedin: "",
  x: "",
  youtube: "",
  instagram: "",

  analyticsRetentionDays: 365,
};

export default async function SettingsPage() {
  await requireOwner();
  await dbConnect();

  const document = (await SiteSettingsModel.findOne({
    key: "primary",
  })
    .lean()
    .exec()) as SiteSettings | null;

  const initialValues: SiteSettingsFormValues = {
    cmsName: document?.cmsName ?? defaultValues.cmsName,

    publicSiteName: document?.publicSiteName ?? defaultValues.publicSiteName,

    tagline: document?.tagline ?? defaultValues.tagline,

    contactEmail: document?.contactEmail ?? defaultValues.contactEmail,

    showEmailPublicly:
      document?.showEmailPublicly ?? defaultValues.showEmailPublicly,

    publicSiteUrl: document?.publicSiteUrl ?? defaultValues.publicSiteUrl,

    publicApiUrl: document?.publicApiUrl ?? defaultValues.publicApiUrl,

    defaultSeoTitle: document?.defaultSeoTitle ?? defaultValues.defaultSeoTitle,

    defaultSeoDescription:
      document?.defaultSeoDescription ?? defaultValues.defaultSeoDescription,

    defaultOgImageUrl:
      document?.defaultOgImageUrl ?? defaultValues.defaultOgImageUrl,

    github: document?.socials?.github ?? "",

    linkedin: document?.socials?.linkedin ?? "",

    x: document?.socials?.x ?? "",

    youtube: document?.socials?.youtube ?? "",

    instagram: document?.socials?.instagram ?? "",

    analyticsRetentionDays:
      document?.analyticsRetentionDays ?? defaultValues.analyticsRetentionDays,
  };

  const hasRevalidationSecret = Boolean(
    process.env.REVALIDATION_SECRET ||
    process.env.CMS_REVALIDATION_SECRET ||
    process.env.PUBLIC_REVALIDATION_SECRET,
  );

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <div>
          <span className="settings-page__eyebrow">System configuration</span>

          <h1>Settings</h1>

          <p>
            Manage global identity, connections, metadata, social links, and
            data preferences.
          </p>
        </div>

        <div className="settings-page__identity">
          <Settings2 size={18} />

          <span>{initialValues.cmsName}</span>
        </div>
      </header>

      <section className="settings-status-grid" aria-label="System status">
        <StatusCard
          icon={Database}
          label="MongoDB"
          value="Connected"
          state="success"
        />

        <StatusCard
          icon={ExternalLink}
          label="Public site"
          value={initialValues.publicSiteUrl ? "Configured" : "Not configured"}
          state={initialValues.publicSiteUrl ? "success" : "warning"}
        />

        <StatusCard
          icon={ExternalLink}
          label="Public API"
          value={initialValues.publicApiUrl ? "Configured" : "Not configured"}
          state={initialValues.publicApiUrl ? "success" : "warning"}
        />

        <StatusCard
          icon={KeyRound}
          label="Revalidation"
          value={
            hasRevalidationSecret ? "Secret configured" : "Secret not detected"
          }
          state={hasRevalidationSecret ? "success" : "warning"}
        />
      </section>

      <SiteSettingsForm initialValues={initialValues} />
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  state,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  state: "success" | "warning";
}) {
  return (
    <article className="settings-status-card">
      <div className="settings-status-card__icon">
        <Icon size={18} />
      </div>

      <div>
        <span>{label}</span>

        <strong data-state={state}>{value}</strong>
      </div>
    </article>
  );
}
