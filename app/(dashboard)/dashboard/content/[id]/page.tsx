import {
  isValidObjectId,
} from "mongoose";
import { notFound } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";
import ContentEntry from "@/models/ContentEntry";
import ContentRevision from "@/models/ContentRevision";
import {
  publishContent,
  saveContentDraft,
  unpublishContent,
} from "../actions";

export const runtime =
  "nodejs";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ContentEditorPage({
  params,
}: PageProps) {
  const session =
    await requireOwner();

  const { id } =
    await params;

  if (!isValidObjectId(id)) {
    notFound();
  }

  await dbConnect();

  const [
    entry,
    revisions,
  ] = await Promise.all([
    ContentEntry.findById(id)
      .lean(),

    ContentRevision.find({
      entryId: id,
    })
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .lean(),
  ]);

  if (!entry) {
    notFound();
  }

  return (
    <>
      <DashboardHeader
        title={entry.title}
        description={`${entry.type} · Draft version ${entry.draftVersion}`}
        githubLogin={
          session.user
            .githubLogin
        }
      />

      <section className="dashboard-editor-state">
        <StatusBadge
          value={
            entry.workflowStatus
          }
        />

        <StatusBadge
          value={
            entry.publicationStatus
          }
        />

        <span>
          Published version:{" "}
          {entry.publishedVersion ??
            "None"}
        </span>
      </section>

      <form
        action={
          saveContentDraft
        }
        className="dashboard-editor"
      >
        <input
          type="hidden"
          name="id"
          value={id}
        />

        <div className="dashboard-editor__grid">
          <label>
            <span>
              Content type
            </span>

            <select
              name="type"
              defaultValue={
                entry.type
              }
            >
              <option value="PAGE">
                Page
              </option>

              <option value="PROJECT">
                Project
              </option>

              <option value="RESEARCH">
                Research
              </option>

              <option value="FRAMEWORK">
                Framework
              </option>

              <option value="WRITING">
                Writing
              </option>

              <option value="MEDIA">
                Media
              </option>

              <option value="ARCHIVE">
                Archive
              </option>
            </select>
          </label>

          <label>
            <span>Slug</span>

            <input
              name="slug"
              defaultValue={
                entry.slug
              }
              required
            />
          </label>
        </div>

        <label>
          <span>Title</span>

          <input
            name="title"
            defaultValue={
              entry.title
            }
            required
          />
        </label>

        <label>
          <span>Summary</span>

          <textarea
            name="summary"
            rows={4}
            defaultValue={
              entry.summary
            }
          />
        </label>

        <label>
          <span>
            Public path
          </span>

          <input
            name="publicPath"
            defaultValue={
              entry.publicPath ??
              ""
            }
          />
        </label>

        <label>
          <span>
            Working draft JSON
          </span>

          <textarea
            name="draftData"
            rows={30}
            spellCheck={false}
            defaultValue={
              JSON.stringify(
                entry.draftData,
                null,
                2,
              )
            }
          />
        </label>

        <footer>
          <p>
            Saving creates a
            new private revision.
          </p>

          <button
            type="submit"
            className="dashboard-primary-button"
          >
            Save draft
          </button>
        </footer>
      </form>

      <section className="dashboard-publish-panel">
        <div>
          <span>
            Publication boundary
          </span>

          <h2>
            Copy this draft into
            the public snapshot
          </h2>

          <p>
            Publishing creates a
            separate public copy.
            Future draft edits will
            not modify that copy.
          </p>
        </div>

        <div className="dashboard-publish-actions">
          <form
            action={
              publishContent
            }
          >
            <input
              type="hidden"
              name="id"
              value={id}
            />

            <button
              type="submit"
              className="dashboard-publish-button"
            >
              Publish version{" "}
              {
                entry.draftVersion
              }
            </button>
          </form>

          {entry.publicationStatus ===
            "PUBLISHED" && (
            <form
              action={
                unpublishContent
              }
            >
              <input
                type="hidden"
                name="id"
                value={id}
              />

              <button
                type="submit"
                className="dashboard-secondary-button"
              >
                Unpublish
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="dashboard-revisions">
        <header>
          <span>
            Revision history
          </span>

          <h2>
            Recent changes
          </h2>
        </header>

        {revisions.map(
          (revision) => (
            <article
              key={
                revision._id.toString()
              }
            >
              <span>
                v
                {
                  revision.revisionNumber
                }
              </span>

              <div>
                <strong>
                  {revision.kind}
                </strong>

                <small>
                  @
                  {
                    revision.actorLogin
                  }
                </small>
              </div>

              <time>
                {revision.createdAt.toLocaleString(
                  "en-US",
                )}
              </time>
            </article>
          ),
        )}
      </section>
    </>
  );
}