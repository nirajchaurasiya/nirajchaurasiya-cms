"use client";

import {
  AlertCircle,
  Archive,
  Check,
  CheckCircle2,
  MailOpen,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useActionState } from "react";

import {
  setMessageStatusAction,
} from "@/app/(dashboard)/dashboard/messages/actions";

type MessageActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialState: MessageActionState = {
  status: "idle",
  message: "",
};

type MessageStatusControlsProps = {
  messageId: string;
  currentStatus: string;
};

const statusActions = [
  {
    value: "READ",
    label: "Mark read",
    icon: MailOpen,
  },
  {
    value: "REPLIED",
    label: "Mark replied",
    icon: Check,
  },
  {
    value: "ARCHIVED",
    label: "Archive",
    icon: Archive,
  },
  {
    value: "SPAM",
    label: "Mark spam",
    icon: ShieldAlert,
  },
  {
    value: "NEW",
    label: "Restore to new",
    icon: RotateCcw,
  },
] as const;

export default function MessageStatusControls({
  messageId,
  currentStatus,
}: MessageStatusControlsProps) {
  const [
    state,
    action,
    pending,
  ] = useActionState(
    setMessageStatusAction,
    initialState,
  );

  return (
    <div className="message-status-controls">
      <div className="message-status-controls__buttons">
        {statusActions
          .filter(
            (statusAction) =>
              statusAction.value !==
              currentStatus,
          )
          .map((statusAction) => {
            const Icon =
              statusAction.icon;

            return (
              <form
                action={action}
                key={statusAction.value}
              >
                <input
                  type="hidden"
                  name="messageId"
                  value={messageId}
                />

                <input
                  type="hidden"
                  name="nextStatus"
                  value={statusAction.value}
                />

                <button
                  type="submit"
                  disabled={pending}
                >
                  <Icon
                    size={15}
                    strokeWidth={1.8}
                  />

                  {statusAction.label}
                </button>
              </form>
            );
          })}
      </div>

      {state.status !== "idle" && (
        <div
          className={`content-action-message content-action-message--${state.status}`}
          role={
            state.status === "error"
              ? "alert"
              : "status"
          }
        >
          {state.status === "success" ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertCircle size={17} />
          )}

          <p>{state.message}</p>
        </div>
      )}
    </div>
  );
}