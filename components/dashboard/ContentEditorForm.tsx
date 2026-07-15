"use client";

import {
  AlertCircle,
  CheckCircle2,
  GripVertical,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  createContentAction,
  updateContentAction,
} from "@/app/(dashboard)/dashboard/content/actions";

import SpecializedContentFields from "@/components/dashboard/SpecializedContentFields";

import {
  contentTypes,
  type ContentType,
  type JsonObject,
} from "@/types/content";

type ContentActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialContentActionState: ContentActionState = {
  status: "idle",
  message: "",
};

type EditorSection = {
  id: string;
  heading: string;
  body: string;
  points: string;
};

type EditorDocument = {
  hero?: {
    eyebrow?: string;
    description?: string;
  };

  details?: Record<string, unknown>;

  sections?: Array<{
    id?: string;
    heading?: string;
    body?: string;
    points?: string[];
  }>;

  tags?: string[];
};

type InitialEntry = {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  summary: string;
  publicPath: string;
  featured: boolean;
  draftVersion: number;
  draftData: JsonObject;
};

type ContentEditorFormProps = {
  mode: "create" | "edit";
  initialEntry?: InitialEntry;
};

type DetailsByType = Record<ContentType, Record<string, unknown>>;

function createSectionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `section-${Date.now()}`;
}

function createSection(): EditorSection {
  return {
    id: createSectionId(),
    heading: "",
    body: "",
    points: "",
  };
}

function readInitialDocument(data?: JsonObject) {
  const document = (data ?? {}) as EditorDocument;

  const details =
    typeof document.details === "object" &&
    document.details !== null &&
    !Array.isArray(document.details)
      ? document.details
      : {};

  const sections = document.sections?.map((section, index) => ({
    id: section.id ?? `section-${index + 1}`,

    heading: section.heading ?? "",

    body: section.body ?? "",

    points: section.points?.join("\n") ?? "",
  })) ?? [
    {
      id: "section-1",
      heading: "",
      body: "",
      points: "",
    },
  ];

  return {
    eyebrow: document.hero?.eyebrow ?? "",

    description: document.hero?.description ?? "",

    tags: document.tags?.join(", ") ?? "",

    details,
    sections,
  };
}

function createDetailsMap(
  selectedType: ContentType,
  initialDetails: Record<string, unknown>,
): DetailsByType {
  return Object.fromEntries(
    contentTypes.map((type) => [
      type,
      type === selectedType ? initialDetails : {},
    ]),
  ) as DetailsByType;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ContentEditorForm({
  mode,
  initialEntry,
}: ContentEditorFormProps) {
  const router = useRouter();
  const initialDocument = useMemo(
    () => readInitialDocument(initialEntry?.draftData),
    [initialEntry?.draftData],
  );

  const [contentType, setContentType] = useState<ContentType>(
    initialEntry?.type ?? "WRITING",
  );

  const [title, setTitle] = useState(initialEntry?.title ?? "");

  const [slug, setSlug] = useState(initialEntry?.slug ?? "");

  const [slugWasEdited, setSlugWasEdited] = useState(
    Boolean(initialEntry?.slug),
  );

  const [eyebrow, setEyebrow] = useState(initialDocument.eyebrow);

  const [description, setDescription] = useState(initialDocument.description);

  const [tags, setTags] = useState(initialDocument.tags);

  const [sections, setSections] = useState(initialDocument.sections);

  const [detailsByType, setDetailsByType] = useState<DetailsByType>(() =>
    createDetailsMap(initialEntry?.type ?? "WRITING", initialDocument.details),
  );

  const selectedAction =
    mode === "create" ? createContentAction : updateContentAction;

  const [state, formAction, pending] = useActionState(
    selectedAction,
    initialContentActionState,
  );

  useEffect(() => {
    if (mode === "edit" && state.status === "success") {
      router.refresh();
    }
  }, [mode, router, state]);

  const structuredData = useMemo(
    () => ({
      hero: {
        eyebrow: eyebrow.trim(),
        description: description.trim(),
      },

      details: detailsByType[contentType],

      sections: sections.map((section) => ({
        id: section.id,
        heading: section.heading.trim(),
        body: section.body.trim(),

        points: section.points
          .split("\n")
          .map((point) => point.trim())
          .filter(Boolean),
      })),

      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }),
    [contentType, description, detailsByType, eyebrow, sections, tags],
  );

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slugWasEdited) {
      setSlug(slugify(value));
    }
  }

  function updateSection(
    id: string,
    field: keyof Omit<EditorSection, "id">,
    value: string,
  ) {
    setSections((current) =>
      current.map((section) =>
        section.id === id
          ? {
              ...section,
              [field]: value,
            }
          : section,
      ),
    );
  }

  function removeSection(id: string) {
    setSections((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((section) => section.id !== id);
    });
  }

  return (
    <form action={formAction} className="content-editor">
      {initialEntry && (
        <>
          <input type="hidden" name="id" value={initialEntry.id} />

          <input
            type="hidden"
            name="expectedDraftVersion"
            value={initialEntry.draftVersion}
          />
        </>
      )}

      <input
        type="hidden"
        name="draftData"
        value={JSON.stringify(structuredData)}
      />

      <section className="content-editor__panel">
        <PanelHeading number="01" eyebrow="Identity" title="Content metadata" />

        <div className="content-editor__two-column">
          <label>
            <span>Content type</span>

            <select
              name="type"
              value={contentType}
              required
              onChange={(event) =>
                setContentType(event.target.value as ContentType)
              }
            >
              {contentTypes.map((type) => (
                <option value={type} key={type}>
                  {type
                    .toLowerCase()
                    .replace(/^\w/, (character) => character.toUpperCase())}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Slug</span>

            <input
              name="slug"
              value={slug}
              required
              placeholder="contextual-behavioral-signals"
              onChange={(event) => {
                setSlugWasEdited(true);

                setSlug(slugify(event.target.value));
              }}
            />
          </label>
        </div>

        <label>
          <span>Title</span>

          <input
            name="title"
            value={title}
            required
            placeholder="Enter the public title"
            onChange={(event) => handleTitleChange(event.target.value)}
          />
        </label>

        <label>
          <span>Summary</span>

          <textarea
            name="summary"
            rows={4}
            defaultValue={initialEntry?.summary ?? ""}
            placeholder="A concise description used in cards, search, metadata, and previews."
          />
        </label>

        <div className="content-editor__two-column">
          <label>
            <span>Public path</span>

            <input
              name="publicPath"
              defaultValue={initialEntry?.publicPath ?? ""}
              placeholder="/writing/example"
            />
          </label>

          <label className="content-editor__checkbox">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={initialEntry?.featured ?? false}
            />

            <span>Feature this entry in prominent areas</span>
          </label>
        </div>
      </section>

      <section className="content-editor__panel">
        <PanelHeading number="02" eyebrow="Presentation" title="Hero content" />

        <label>
          <span>Eyebrow</span>

          <input
            value={eyebrow}
            placeholder="Research · Learning · Evidence"
            onChange={(event) => setEyebrow(event.target.value)}
          />
        </label>

        <label>
          <span>Opening description</span>

          <textarea
            rows={6}
            value={description}
            placeholder="Introduce the entry and its central direction."
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label>
          <span>Tags</span>

          <input
            value={tags}
            placeholder="Learning, Evidence, Uncertainty"
            onChange={(event) => setTags(event.target.value)}
          />

          <small>Separate tags with commas.</small>
        </label>
      </section>

      <section className="content-editor__panel">
        <PanelHeading
          number="03"
          eyebrow={contentType}
          title="Specialized fields"
        />

        <SpecializedContentFields
          type={contentType}
          value={detailsByType[contentType]}
          onChange={(nextDetails) =>
            setDetailsByType((current) => ({
              ...current,

              [contentType]: nextDetails,
            }))
          }
        />
      </section>

      <section className="content-editor__panel">
        <div className="content-editor__panel-heading">
          <span>04</span>

          <div>
            <small>Structure</small>
            <h2>Content sections</h2>
          </div>

          <button
            type="button"
            className="content-editor__add"
            onClick={() =>
              setSections((current) => [...current, createSection()])
            }
          >
            <Plus size={16} />
            Add section
          </button>
        </div>

        <div className="content-section-list">
          {sections.map((section, index) => (
            <article className="content-section-editor" key={section.id}>
              <header>
                <GripVertical size={18} aria-hidden="true" />

                <span>Section {String(index + 1).padStart(2, "0")}</span>

                <button
                  type="button"
                  aria-label="Remove section"
                  disabled={sections.length === 1}
                  onClick={() => removeSection(section.id)}
                >
                  <Trash2 size={16} />
                </button>
              </header>

              <label>
                <span>Heading</span>

                <input
                  value={section.heading}
                  placeholder="Section heading"
                  onChange={(event) =>
                    updateSection(section.id, "heading", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Body</span>

                <textarea
                  rows={8}
                  value={section.body}
                  placeholder="Write the section content."
                  onChange={(event) =>
                    updateSection(section.id, "body", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Points</span>

                <textarea
                  rows={5}
                  value={section.points}
                  placeholder={"One point per line\nSecond point\nThird point"}
                  onChange={(event) =>
                    updateSection(section.id, "points", event.target.value)
                  }
                />

                <small>Enter one list item per line.</small>
              </label>
            </article>
          ))}
        </div>
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

      <footer className="content-editor__footer">
        <div>
          <strong>
            {mode === "create"
              ? "Private draft"
              : `Draft version ${initialEntry?.draftVersion ?? 1}`}
          </strong>

          <p>Saving does not publish the entry.</p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="dashboard-primary-button"
        >
          <Save size={16} />

          {pending
            ? "Saving..."
            : mode === "create"
              ? "Create draft"
              : "Save new revision"}
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
    <div className="content-editor__panel-heading">
      <span>{number}</span>

      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
      </div>
    </div>
  );
}
