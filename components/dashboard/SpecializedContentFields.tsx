"use client";

import type { ContentType } from "@/types/content";

type Details = Record<string, unknown>;

type SpecializedContentFieldsProps = {
  type: ContentType;
  slug: string;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
};
function readString(value: Details, key: string) {
  const result = value[key];

  return typeof result === "string" ? result : "";
}

function readNumber(value: Details, key: string) {
  const result = value[key];

  return typeof result === "number" ? String(result) : "";
}

function readList(value: Details, key: string) {
  const result = value[key];

  if (Array.isArray(result)) {
    return result
      .filter((item): item is string => typeof item === "string")
      .join("\n");
  }

  return "";
}
type HomepageSpecializedFieldsProps = {
  value: Record<string, unknown>;

  onChange: (value: Record<string, unknown>) => void;
};

function readStringField(value: Record<string, unknown>, key: string) {
  const field = value[key];

  return typeof field === "string" ? field : "";
}

function HomepageSpecializedFields({
  value,
  onChange,
}: HomepageSpecializedFieldsProps) {
  function updateField(key: string, fieldValue: string) {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  }

  return (
    <div className="specialized-fields">
      <div className="specialized-fields__introduction">
        <strong>Homepage configuration</strong>

        <p>
          Controls the main homepage statement, actions, and current direction
          panel.
        </p>
      </div>

      <label>
        <span>Hero title</span>

        <textarea
          rows={5}
          value={readStringField(value, "heroTitle")}
          placeholder="I build systems for questions that do not have obvious answers."
          onChange={(event) => updateField("heroTitle", event.target.value)}
        />

        <small>
          Displayed as the large heading at the top of the homepage.
        </small>
      </label>

      <div className="content-editor__two-column">
        <label>
          <span>Primary button label</span>

          <input
            value={readStringField(value, "primaryCtaLabel")}
            placeholder="Explore the work"
            onChange={(event) =>
              updateField("primaryCtaLabel", event.target.value)
            }
          />
        </label>

        <label>
          <span>Primary button path</span>

          <input
            value={readStringField(value, "primaryCtaHref")}
            placeholder="/work"
            onChange={(event) =>
              updateField("primaryCtaHref", event.target.value)
            }
          />
        </label>
      </div>

      <div className="content-editor__two-column">
        <label>
          <span>Secondary button label</span>

          <input
            value={readStringField(value, "secondaryCtaLabel")}
            placeholder="What I am doing now"
            onChange={(event) =>
              updateField("secondaryCtaLabel", event.target.value)
            }
          />
        </label>

        <label>
          <span>Secondary button path</span>

          <input
            value={readStringField(value, "secondaryCtaHref")}
            placeholder="/now"
            onChange={(event) =>
              updateField("secondaryCtaHref", event.target.value)
            }
          />
        </label>
      </div>

      <label>
        <span>Current direction label</span>

        <input
          value={readStringField(value, "currentLabel")}
          placeholder="Current direction"
          onChange={(event) => updateField("currentLabel", event.target.value)}
        />
      </label>

      <label>
        <span>Current direction text</span>

        <textarea
          rows={5}
          value={readStringField(value, "currentText")}
          placeholder="Mechanical engineering, credibility-first learning systems, robotics, research..."
          onChange={(event) => updateField("currentText", event.target.value)}
        />

        <small>Displayed in the homepage current-direction card.</small>
      </label>
    </div>
  );
}
export default function SpecializedContentFields({
  type,
  slug,
  value,
  onChange,
}: SpecializedContentFieldsProps) {
  function setField(key: string, fieldValue: unknown) {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  }

  function setList(key: string, fieldValue: string) {
    setField(
      key,
      fieldValue
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    );
  }
  if (type === "PAGE" && slug === "home") {
    return <HomepageSpecializedFields value={value} onChange={onChange} />;
  }
  if (type === "PROJECT") {
    return (
      <>
        <div className="content-editor__two-column">
          <SelectField
            label="Project status"
            value={readString(value, "status")}
            options={[
              "Exploring",
              "Building",
              "Active",
              "Paused",
              "Completed",
              "Archived",
            ]}
            onChange={(nextValue) => setField("status", nextValue)}
          />

          <TextField
            label="Current stage"
            value={readString(value, "stage")}
            placeholder="Prototype development"
            onChange={(nextValue) => setField("stage", nextValue)}
          />
        </div>

        <TextAreaField
          label="Central question"
          value={readString(value, "centralQuestion")}
          placeholder="What system-level question is this project exploring?"
          onChange={(nextValue) => setField("centralQuestion", nextValue)}
        />

        <ListField
          label="Technologies"
          value={readList(value, "technologies")}
          placeholder={"Next.js\nMongoDB\nNode.js"}
          onChange={(nextValue) => setList("technologies", nextValue)}
        />

        <div className="content-editor__two-column">
          <TextField
            label="Live URL"
            type="url"
            value={readString(value, "liveUrl")}
            placeholder="https://example.com"
            onChange={(nextValue) => setField("liveUrl", nextValue)}
          />

          <TextField
            label="Repository URL"
            type="url"
            value={readString(value, "repositoryUrl")}
            placeholder="https://github.com/..."
            onChange={(nextValue) => setField("repositoryUrl", nextValue)}
          />
        </div>
      </>
    );
  }

  if (type === "RESEARCH") {
    return (
      <>
        <div className="content-editor__two-column">
          <SelectField
            label="Research status"
            value={readString(value, "status")}
            options={[
              "Exploring",
              "Developing",
              "In Progress",
              "Published",
              "Archived",
            ]}
            onChange={(nextValue) => setField("status", nextValue)}
          />

          <TextField
            label="Research kind"
            value={readString(value, "kind")}
            placeholder="Independent research essay"
            onChange={(nextValue) => setField("kind", nextValue)}
          />
        </div>

        <TextAreaField
          label="Research question"
          value={readString(value, "question")}
          placeholder="What exactly is being investigated?"
          onChange={(nextValue) => setField("question", nextValue)}
        />

        <TextAreaField
          label="Central claim"
          value={readString(value, "centralClaim")}
          placeholder="What is the current claim or argument?"
          onChange={(nextValue) => setField("centralClaim", nextValue)}
        />

        <ListField
          label="Methods"
          value={readList(value, "methods")}
          placeholder={"Literature review\nSystem analysis\nData exploration"}
          onChange={(nextValue) => setList("methods", nextValue)}
        />

        <ListField
          label="Limitations"
          value={readList(value, "limitations")}
          placeholder={"Limited sample\nNo peer review\nDeveloping methodology"}
          onChange={(nextValue) => setList("limitations", nextValue)}
        />
      </>
    );
  }

  if (type === "FRAMEWORK") {
    return (
      <>
        <div className="content-editor__two-column">
          <TextField
            label="Version"
            value={readString(value, "version")}
            placeholder="1.0"
            onChange={(nextValue) => setField("version", nextValue)}
          />

          <SelectField
            label="Framework status"
            value={readString(value, "status")}
            options={["Developing", "Active", "Revising", "Archived"]}
            onChange={(nextValue) => setField("status", nextValue)}
          />
        </div>

        <TextField
          label="Category"
          value={readString(value, "category")}
          placeholder="Systems Thinking"
          onChange={(nextValue) => setField("category", nextValue)}
        />

        <TextAreaField
          label="Central question"
          value={readString(value, "question")}
          placeholder="What problem does the framework help examine?"
          onChange={(nextValue) => setField("question", nextValue)}
        />

        <TextAreaField
          label="Central principle"
          value={readString(value, "principle")}
          placeholder="The core reasoning principle behind the framework."
          onChange={(nextValue) => setField("principle", nextValue)}
        />

        <ListField
          label="Framework components"
          value={readList(value, "components")}
          placeholder={"System\nInputs\nGoverning Interactions\nOutputs"}
          onChange={(nextValue) => setList("components", nextValue)}
        />
      </>
    );
  }

  if (type === "WRITING") {
    return (
      <>
        <div className="content-editor__two-column">
          <SelectField
            label="Writing category"
            value={readString(value, "category")}
            options={[
              "Essay",
              "Reflection",
              "Building Note",
              "Research Note",
              "Field Note",
            ]}
            onChange={(nextValue) => setField("category", nextValue)}
          />

          <TextField
            label="Reading time"
            value={readString(value, "readingTime")}
            placeholder="6 min read"
            onChange={(nextValue) => setField("readingTime", nextValue)}
          />
        </div>

        <TextAreaField
          label="Central question"
          value={readString(value, "centralQuestion")}
          placeholder="What question organizes this piece?"
          onChange={(nextValue) => setField("centralQuestion", nextValue)}
        />

        <div className="content-editor__two-column">
          <TextField
            label="External URL"
            type="url"
            value={readString(value, "externalUrl")}
            placeholder="https://medium.com/..."
            onChange={(nextValue) => setField("externalUrl", nextValue)}
          />

          <TextField
            label="Original publication date"
            type="date"
            value={readString(value, "originalPublishedAt")}
            onChange={(nextValue) => setField("originalPublishedAt", nextValue)}
          />
        </div>
      </>
    );
  }

  if (type === "MEDIA") {
    return (
      <>
        <div className="content-editor__two-column">
          <SelectField
            label="Media type"
            value={readString(value, "mediaType")}
            options={[
              "Video Series",
              "Short Series",
              "Playlist",
              "Talk",
              "Presentation",
              "Interview",
            ]}
            onChange={(nextValue) => setField("mediaType", nextValue)}
          />

          <SelectField
            label="Media status"
            value={readString(value, "status")}
            options={["Developing", "Ongoing", "Published", "Archived"]}
            onChange={(nextValue) => setField("status", nextValue)}
          />
        </div>

        <TextField
          label="Platform"
          value={readString(value, "platform")}
          placeholder="YouTube · TechXEng"
          onChange={(nextValue) => setField("platform", nextValue)}
        />

        <div className="content-editor__two-column">
          <TextField
            label="External URL"
            type="url"
            value={readString(value, "externalUrl")}
            placeholder="https://youtube.com/..."
            onChange={(nextValue) => setField("externalUrl", nextValue)}
          />

          <NumberField
            label="Episode count"
            value={readNumber(value, "episodeCount")}
            onChange={(nextValue) => setField("episodeCount", nextValue)}
          />
        </div>
      </>
    );
  }

  if (type === "ARCHIVE") {
    return (
      <>
        <div className="content-editor__two-column">
          <TextField
            label="Archive type"
            value={readString(value, "archiveType")}
            placeholder="Project Version"
            onChange={(nextValue) => setField("archiveType", nextValue)}
          />

          <TextField
            label="Original period"
            value={readString(value, "originalPeriod")}
            placeholder="2025–2026"
            onChange={(nextValue) => setField("originalPeriod", nextValue)}
          />
        </div>

        <TextField
          label="Archived date"
          type="date"
          value={readString(value, "archivedAt")}
          onChange={(nextValue) => setField("archivedAt", nextValue)}
        />

        <TextAreaField
          label="Reason for archiving"
          value={readString(value, "reason")}
          placeholder="Why was this version or assumption retired?"
          onChange={(nextValue) => setField("reason", nextValue)}
        />

        <TextField
          label="Replacement path"
          value={readString(value, "replacementHref")}
          placeholder="/work/current-project"
          onChange={(nextValue) => setField("replacementHref", nextValue)}
        />
      </>
    );
  }

  return (
    <>
      <TextField
        label="Navigation label"
        value={readString(value, "navigationLabel")}
        placeholder="About"
        onChange={(nextValue) => setField("navigationLabel", nextValue)}
      />

      <TextAreaField
        label="Page purpose"
        value={readString(value, "purpose")}
        placeholder="What role does this page serve?"
        onChange={(nextValue) => setField("purpose", nextValue)}
      />
    </>
  );
}

function TextField({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <label>
      <span>{label}</span>

      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value.trim();

          onChange(nextValue ? Number(nextValue) : null);
        }}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>

      <textarea
        rows={5}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ListField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>

      <textarea
        rows={6}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />

      <small>Enter one item per line.</small>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>

      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select an option</option>

        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
