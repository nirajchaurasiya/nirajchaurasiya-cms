"use client";

import { AlertCircle, CheckCircle2, Save } from "lucide-react";

import { useActionState, useEffect } from "react";

import { useRouter } from "next/navigation";

import {
  type SettingsActionState,
  updateSiteSettingsAction,
} from "@/app/(dashboard)/dashboard/settings/actions";

export type SiteSettingsFormValues = {
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

  github: string;
  linkedin: string;
  x: string;
  youtube: string;
  instagram: string;

  analyticsRetentionDays: number;
};

type SiteSettingsFormProps = {
  initialValues: SiteSettingsFormValues;
};

const initialState: SettingsActionState = {
  status: "idle",
  message: "",
};

export default function SiteSettingsForm({
  initialValues,
}: SiteSettingsFormProps) {
  const router = useRouter();

  const [state, action, pending] = useActionState(
    updateSiteSettingsAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={action} className="settings-form">
      <section className="settings-form__panel">
        <PanelHeading
          number="01"
          eyebrow="Identity"
          title="CMS and site identity"
        />

        <div className="settings-form__two-column">
          <label>
            <span>CMS name</span>

            <input
              name="cmsName"
              required
              defaultValue={initialValues.cmsName}
              placeholder="Niraj Analytics"
            />
          </label>

          <label>
            <span>Public site name</span>

            <input
              name="publicSiteName"
              required
              defaultValue={initialValues.publicSiteName}
              placeholder="Niraj Kumar Chaurasiya"
            />
          </label>
        </div>

        <label>
          <span>Tagline</span>

          <input
            name="tagline"
            defaultValue={initialValues.tagline}
            placeholder="Building systems under uncertainty"
          />
        </label>

        <div className="settings-form__two-column">
          <label>
            <span>Contact email</span>

            <input
              type="email"
              name="contactEmail"
              defaultValue={initialValues.contactEmail}
              placeholder="name@example.com"
            />
          </label>

          <label className="settings-form__checkbox">
            <input
              type="checkbox"
              name="showEmailPublicly"
              defaultChecked={initialValues.showEmailPublicly}
            />

            <span>Allow the public site to display this email</span>
          </label>
        </div>
      </section>

      <section className="settings-form__panel">
        <PanelHeading
          number="02"
          eyebrow="Connections"
          title="Public application"
        />

        <div className="settings-form__two-column">
          <label>
            <span>Public site URL</span>

            <input
              type="url"
              name="publicSiteUrl"
              defaultValue={initialValues.publicSiteUrl}
              placeholder="https://nirajchaurasiya.com"
            />
          </label>

          <label>
            <span>Public content API URL</span>

            <input
              type="url"
              name="publicApiUrl"
              defaultValue={initialValues.publicApiUrl}
              placeholder="https://analytics.example.com/api/public/content"
            />
          </label>
        </div>

        <p className="settings-form__note">
          URLs may be stored here, but API keys, authentication secrets, and
          revalidation secrets remain in environment variables.
        </p>
      </section>

      <section className="settings-form__panel">
        <PanelHeading
          number="03"
          eyebrow="Metadata"
          title="Default search and sharing"
        />

        <label>
          <span>Default SEO title</span>

          <input
            name="defaultSeoTitle"
            defaultValue={initialValues.defaultSeoTitle}
            placeholder="Niraj Kumar Chaurasiya"
          />
        </label>

        <label>
          <span>Default SEO description</span>

          <textarea
            name="defaultSeoDescription"
            rows={5}
            defaultValue={initialValues.defaultSeoDescription}
            placeholder="Default description used when a page does not provide its own metadata."
          />
        </label>

        <label>
          <span>Default Open Graph image URL</span>

          <input
            type="url"
            name="defaultOgImageUrl"
            defaultValue={initialValues.defaultOgImageUrl}
            placeholder="https://example.com/og-image.jpg"
          />
        </label>
      </section>

      <section className="settings-form__panel">
        <PanelHeading number="04" eyebrow="Presence" title="Social links" />

        <div className="settings-form__two-column">
          <label>
            <span>GitHub</span>

            <input
              type="url"
              name="github"
              defaultValue={initialValues.github}
              placeholder="https://github.com/..."
            />
          </label>

          <label>
            <span>LinkedIn</span>

            <input
              type="url"
              name="linkedin"
              defaultValue={initialValues.linkedin}
              placeholder="https://linkedin.com/in/..."
            />
          </label>

          <label>
            <span>X</span>

            <input
              type="url"
              name="x"
              defaultValue={initialValues.x}
              placeholder="https://x.com/..."
            />
          </label>

          <label>
            <span>YouTube</span>

            <input
              type="url"
              name="youtube"
              defaultValue={initialValues.youtube}
              placeholder="https://youtube.com/@..."
            />
          </label>

          <label>
            <span>Instagram</span>

            <input
              type="url"
              name="instagram"
              defaultValue={initialValues.instagram}
              placeholder="https://instagram.com/..."
            />
          </label>
        </div>
      </section>

      <section className="settings-form__panel">
        <PanelHeading
          number="05"
          eyebrow="Data"
          title="Analytics preferences"
        />

        <label className="settings-form__narrow-field">
          <span>Analytics retention period</span>

          <input
            type="number"
            name="analyticsRetentionDays"
            min={30}
            max={3650}
            defaultValue={initialValues.analyticsRetentionDays}
          />

          <small>
            Number of days to retain analytics records. This setting does not
            delete records until a cleanup process is connected.
          </small>
        </label>
      </section>

      {state.status !== "idle" && (
        <div
          className={`content-action-message content-action-message--${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.status === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <p>{state.message}</p>
        </div>
      )}

      <footer className="settings-form__footer">
        <div>
          <strong>Global configuration</strong>

          <p>
            These values apply across the CMS and may later be consumed by the
            public portfolio.
          </p>
        </div>

        <button
          type="submit"
          className="dashboard-primary-button"
          disabled={pending}
        >
          <Save size={16} />

          {pending ? "Saving..." : "Save settings"}
        </button>
      </footer>
    </form>
  );
}

function PanelHeading({
  number,
  eyebrow,
  title,
}: {
  number: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="settings-form__panel-heading">
      <span>{number}</span>

      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
      </div>
    </div>
  );
}
