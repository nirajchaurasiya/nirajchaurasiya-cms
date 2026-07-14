"use client";

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useActionState,
  useMemo,
  useState,
} from "react";

import {
  removeRelationshipAction,
  saveRelationshipAction,
} from "@/app/(dashboard)/dashboard/content/relationship-actions";

import {
  relationKinds,
  type RelationKind,
} from "@/types/content";

type RelationshipActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialState: RelationshipActionState = {
  status: "idle",
  message: "",
};

type Candidate = {
  id: string;
  title: string;
  type: string;
  slug: string;
  publicationStatus: string;
};

type ExistingRelationship = {
  id: string;
  targetId: string;
  relationKind: RelationKind;
  description: string | null;
  sortOrder: number;
};

type RelationshipManagerProps = {
  sourceId: string;
  candidates: Candidate[];
  relationships: ExistingRelationship[];
};

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default function RelationshipManager({
  sourceId,
  candidates,
  relationships,
}: RelationshipManagerProps) {
  const [
    targetId,
    setTargetId,
  ] = useState("");

  const [
    relationKind,
    setRelationKind,
  ] = useState<RelationKind>(
    "RELATED_PROJECT",
  );

  const [
    saveState,
    saveAction,
    saving,
  ] = useActionState(
    saveRelationshipAction,
    initialState,
  );

  const [
    removeState,
    removeAction,
    removing,
  ] = useActionState(
    removeRelationshipAction,
    initialState,
  );

  const candidateMap = useMemo(
    () =>
      new Map(
        candidates.map((candidate) => [
          candidate.id,
          candidate,
        ]),
      ),
    [candidates],
  );

  const state =
    saveState.status !== "idle"
      ? saveState
      : removeState;

  return (
    <section className="relationship-panel">
      <header>
        <div>
          <span>
            Relationship system
          </span>

          <h2>
            Connect this entry to the rest of the knowledge system
          </h2>

          <p>
            Relationships allow projects, research,
            frameworks, writing, media, and archived
            versions to appear automatically in connected
            contexts.
          </p>
        </div>

        <Link2
          size={25}
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </header>

      <form
        action={saveAction}
        className="relationship-form"
      >
        <input
          type="hidden"
          name="sourceId"
          value={sourceId}
        />

        <label>
          <span>Target entry</span>

          <select
            name="targetId"
            value={targetId}
            required
            onChange={(event) =>
              setTargetId(
                event.target.value,
              )
            }
          >
            <option value="">
              Select content
            </option>

            {candidates.map(
              (candidate) => (
                <option
                  value={candidate.id}
                  key={candidate.id}
                >
                  {candidate.title} ·{" "}
                  {formatLabel(
                    candidate.type,
                  )}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>Relationship type</span>

          <select
            name="relationKind"
            value={relationKind}
            onChange={(event) =>
              setRelationKind(
                event.target
                  .value as RelationKind,
              )
            }
          >
            {relationKinds.map(
              (kind) => (
                <option
                  value={kind}
                  key={kind}
                >
                  {formatLabel(kind)}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>Description</span>

          <input
            name="description"
            placeholder="Why are these entries connected?"
          />
        </label>

        <label>
          <span>Order</span>

          <input
            type="number"
            name="sortOrder"
            min={0}
            defaultValue={0}
          />
        </label>

        <button
          type="submit"
          disabled={
            saving || !targetId
          }
          className="dashboard-primary-button"
        >
          <Plus size={16} />

          {saving
            ? "Saving..."
            : "Save relationship"}
        </button>
      </form>

      {state.status !== "idle" && (
        <div
          className={`content-action-message content-action-message--${state.status}`}
        >
          {state.status ===
          "success" ? (
            <CheckCircle2
              size={18}
            />
          ) : (
            <AlertCircle
              size={18}
            />
          )}

          <p>{state.message}</p>
        </div>
      )}

      <div className="relationship-list">
        {relationships.map(
          (relationship) => {
            const target =
              candidateMap.get(
                relationship.targetId,
              );

            return (
              <article
                key={relationship.id}
              >
                <div className="relationship-list__icon">
                  <ArrowUpRight
                    size={17}
                  />
                </div>

                <div>
                  <small>
                    {formatLabel(
                      relationship.relationKind,
                    )}
                  </small>

                  <strong>
                    {target?.title ??
                      "Missing target"}
                  </strong>

                  <p>
                    {relationship.description ??
                      "No relationship description."}
                  </p>
                </div>

                <span>
                  {target?.type ??
                    "UNKNOWN"}
                </span>

                <form
                  action={removeAction}
                >
                  <input
                    type="hidden"
                    name="relationId"
                    value={
                      relationship.id
                    }
                  />

                  <input
                    type="hidden"
                    name="sourceId"
                    value={sourceId}
                  />

                  <button
                    type="submit"
                    disabled={removing}
                    aria-label="Remove relationship"
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                </form>
              </article>
            );
          },
        )}

        {relationships.length ===
          0 && (
          <div className="relationship-empty">
            <Link2
              size={23}
              strokeWidth={1.5}
            />

            <h3>
              No relationships yet.
            </h3>

            <p>
              Connect this entry to a project,
              research question, framework,
              writing piece, media item, or
              archived version.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}