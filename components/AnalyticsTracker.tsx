"use client";

import {
  usePathname,
} from "next/navigation";
import {
  useEffect,
  useRef,
} from "react";

type AnalyticsEventName =
  | "PAGE_VIEW"
  | "EXTERNAL_CLICK"
  | "CONTACT_SUBMIT"
  | "SEARCH";

type AnalyticsPayload = {
  eventName: AnalyticsEventName;
  path?: string;
  targetUrl?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
};

const SESSION_STORAGE_KEY =
  "niraj-analytics-session";

function createSessionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
}

function getSessionId() {
  const existing =
    window.sessionStorage.getItem(
      SESSION_STORAGE_KEY,
    );

  if (existing) {
    return existing;
  }

  const created =
    createSessionId();

  window.sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    created,
  );

  return created;
}

function sendAnalyticsEvent(
  payload: AnalyticsPayload,
) {
  const body = JSON.stringify({
    ...payload,
    sessionId:
      getSessionId(),
  });

  if (
    typeof navigator.sendBeacon ===
    "function"
  ) {
    const blob = new Blob(
      [body],
      {
        type: "application/json",
      },
    );

    navigator.sendBeacon(
      "/api/analytics",
      blob,
    );

    return;
  }

  void fetch(
    "/api/analytics",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body,
      keepalive: true,
    },
  );
}

export function trackPublicEvent(
  payload: AnalyticsPayload,
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  sendAnalyticsEvent(
    payload,
  );
}

export default function AnalyticsTracker() {
  const pathname =
    usePathname();

  const lastTrackedPath =
    useRef<string | null>(
      null,
    );

  useEffect(() => {
    const currentPath =
      `${window.location.pathname}${window.location.search}`;

    if (
      lastTrackedPath.current ===
      currentPath
    ) {
      return;
    }

    lastTrackedPath.current =
      currentPath;

    sendAnalyticsEvent({
      eventName: "PAGE_VIEW",
      path: currentPath,
      referrer:
        document.referrer || undefined,
    });
  }, [pathname]);

  useEffect(() => {
    function handleClick(
      event: MouseEvent,
    ) {
      const target =
        event.target;

      if (
        !(target instanceof Element)
      ) {
        return;
      }

      const anchor =
        target.closest("a");

      if (!anchor?.href) {
        return;
      }

      let destination: URL;

      try {
        destination =
          new URL(
            anchor.href,
            window.location.href,
          );
      } catch {
        return;
      }

      if (
        ![
          "http:",
          "https:",
        ].includes(
          destination.protocol,
        )
      ) {
        return;
      }

      if (
        destination.origin ===
        window.location.origin
      ) {
        return;
      }

      sendAnalyticsEvent({
        eventName:
          "EXTERNAL_CLICK",

        path:
          `${window.location.pathname}${window.location.search}`,

        targetUrl:
          destination.toString(),
      });
    }

    document.addEventListener(
      "click",
      handleClick,
    );

    return () => {
      document.removeEventListener(
        "click",
        handleClick,
      );
    };
  }, []);

  return null;
}