export const contentTypes = [
  "PAGE",
  "PROJECT",
  "RESEARCH",
  "FRAMEWORK",
  "WRITING",
  "MEDIA",
  "ARCHIVE",
] as const;

export const workflowStatuses = [
  "DRAFT",
  "REVIEW",
  "READY",
  "SYNCED",
  "ARCHIVED",
] as const;

export const publicationStatuses = [
  "NEVER_PUBLISHED",
  "PUBLISHED",
  "UNPUBLISHED",
] as const;

export const revisionKinds = [
  "CREATED",
  "DRAFT_SAVED",
  "REVIEW_REQUESTED",
  "MARKED_READY",
  "PUBLISHED",
  "UNPUBLISHED",
  "ARCHIVED",
  "RESTORED",
] as const;

export const relationKinds = [
  "RELATED_PROJECT",
  "RELATED_RESEARCH",
  "RELATED_FRAMEWORK",
  "RELATED_WRITING",
  "RELATED_MEDIA",
  "RELATED_ARCHIVE",
  "REPLACED_BY",
  "DEPENDS_ON",
  "PRODUCED_BY",
] as const;

export const publishActions = [
  "PUBLISH",
  "UNPUBLISH",
  "ARCHIVE",
  "REVALIDATE",
  "FULL_SYNC",
] as const;

export const publishJobStatuses = [
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
] as const;

export const messageStatuses = [
  "NEW",
  "READ",
  "REPLIED",
  "ARCHIVED",
  "SPAM",
] as const;

export const auditActions = [
  "CREATE",
  "UPDATE",
  "REVIEW",
  "READY",
  "PUBLISH",
  "UNPUBLISH",
  "ARCHIVE",
  "RESTORE",
  "DELETE",
  "MESSAGE_RECEIVED",
  "SETTING_CHANGED",
] as const;

export type ContentType =
  (typeof contentTypes)[number];

export type WorkflowStatus =
  (typeof workflowStatuses)[number];

export type PublicationStatus =
  (typeof publicationStatuses)[number];

export type RevisionKind =
  (typeof revisionKinds)[number];

export type RelationKind =
  (typeof relationKinds)[number];

export type PublishAction =
  (typeof publishActions)[number];

export type PublishJobStatus =
  (typeof publishJobStatuses)[number];

export type MessageStatus =
  (typeof messageStatuses)[number];

export type AuditAction =
  (typeof auditActions)[number];

export type JsonObject = Record<string, unknown>;