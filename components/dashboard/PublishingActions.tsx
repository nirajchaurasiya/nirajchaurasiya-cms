"use client";

import {
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
  RotateCcw,
} from "lucide-react";
import {
  useActionState,
} from "react";

import {
  retryPublishJobAction,
  triggerFullSyncAction,
} from "@/app/(dashboard)/dashboard/publishing/actions";

type PublishingActionState = {
  status:
    | "idle"
    | "success"
    | "error";

  message: string;
};

const initialState:
  PublishingActionState = {
    status: "idle",
    message: "",
  };

export function FullSyncControl() {
  const [
    state,
    action,
    pending,
  ] = useActionState(
    triggerFullSyncAction,
    initialState,
  );

  return (
    <div className="full-sync-control">
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="dashboard-primary-button"
        >
          <RefreshCcw size={16} />

          {pending
            ? "Synchronizing..."
            : "Synchronize everything"}
        </button>
      </form>

      <ActionMessage state={state} />
    </div>
  );
}

export function RetryJobControl({
  jobId,
}: {
  jobId: string;
}) {
  const [
    state,
    action,
    pending,
  ] = useActionState(
    retryPublishJobAction,
    initialState,
  );

  return (
    <div className="retry-job-control">
      <form action={action}>
        <input
          type="hidden"
          name="jobId"
          value={jobId}
        />

        <button
          type="submit"
          disabled={pending}
          aria-label="Retry publishing job"
        >
          <RotateCcw size={15} />

          {pending
            ? "Retrying..."
            : "Retry"}
        </button>
      </form>

      <ActionMessage
        state={state}
        compact
      />
    </div>
  );
}

function ActionMessage({
  state,
  compact = false,
}: {
  state: PublishingActionState;
  compact?: boolean;
}) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <div
      className={`publishing-action-message publishing-action-message--${state.status} ${
        compact
          ? "publishing-action-message--compact"
          : ""
      }`}
      role={
        state.status === "error"
          ? "alert"
          : "status"
      }
    >
      {state.status ===
      "success" ? (
        <CheckCircle2
          size={16}
        />
      ) : (
        <AlertCircle
          size={16}
        />
      )}

      <span>{state.message}</span>
    </div>
  );
}