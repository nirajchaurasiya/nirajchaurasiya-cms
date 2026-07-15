"use client";

import { AlertCircle, CheckCircle2, Globe2, GlobeLock } from "lucide-react";
import { useActionState, useEffect } from "react";

import { useRouter } from "next/navigation";
import {
  publishContentAction,
  unpublishContentAction,
} from "@/app/(dashboard)/dashboard/content/actions";

type ContentActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialContentActionState: ContentActionState = {
  status: "idle",
  message: "",
};

type PublicationControlsProps = {
  id: string;
  draftVersion: number;
  publishedVersion: number | null;
  publicationStatus: string;
};

export default function PublicationControls({
  id,
  draftVersion,
  publishedVersion,
  publicationStatus,
}: PublicationControlsProps) {
  const router = useRouter();
  const safeDraftVersion =
    typeof draftVersion === "number" &&
    Number.isInteger(draftVersion) &&
    draftVersion > 0
      ? draftVersion
      : 1;

  const [publishState, publishAction, publishing] = useActionState(
    publishContentAction,
    initialContentActionState,
  );

  const [unpublishState, unpublishAction, unpublishing] = useActionState(
    unpublishContentAction,
    initialContentActionState,
  );

  useEffect(() => {
    if (
      publishState.status === "success" ||
      unpublishState.status === "success"
    ) {
      router.refresh();
    }
  }, [publishState, router, unpublishState]);

  const state = publishState.status !== "idle" ? publishState : unpublishState;

  return (
    <section className="publication-panel">
      <div className="publication-panel__content">
        <span>Publication boundary</span>

        <h2>Copy the current draft into the public snapshot</h2>

        <p>
          The public website receives a separate copy. Later edits remain
          private until another publication occurs.
        </p>

        <div className="publication-version-state">
          <article>
            <span>Working draft</span>
            <strong>v{safeDraftVersion}</strong>
          </article>

          <article>
            <span>Public snapshot</span>

            <strong>
              {typeof publishedVersion === "number"
                ? `v${publishedVersion}`
                : "None"}
            </strong>
          </article>
        </div>

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
      </div>

      <div className="publication-panel__actions">
        <form action={publishAction}>
          <input type="hidden" name="id" value={id} />

          <input
            type="hidden"
            name="expectedDraftVersion"
            value={safeDraftVersion}
          />

          <button
            type="submit"
            disabled={publishing || !id}
            className="dashboard-publish-button"
          >
            <Globe2 size={17} />

            {publishing ? "Publishing..." : `Publish v${safeDraftVersion}`}
          </button>
        </form>

        {publicationStatus === "PUBLISHED" && (
          <form action={unpublishAction}>
            <input type="hidden" name="id" value={id} />

            <button
              type="submit"
              disabled={unpublishing || !id}
              className="dashboard-secondary-button"
            >
              <GlobeLock size={17} />

              {unpublishing ? "Unpublishing..." : "Unpublish"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
