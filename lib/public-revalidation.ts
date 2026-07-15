import "server-only";

export type PublicRevalidationPayload = {
  contentId: string;
  type: string;
  slug: string;
  publicPath: string | null;
  version: number | null;
  action:
    | "PUBLISH"
    | "UNPUBLISH"
    | "RELATIONSHIP_UPDATED"
    | "RELATIONSHIP_REMOVED"
    | "FULL_SYNC";
};

type PublicRevalidationResult = {
  skipped: boolean;
  status: number | null;
  body: string;
};

export async function requestPublicRevalidation(
  payload: PublicRevalidationPayload,
): Promise<PublicRevalidationResult> {
  const revalidationUrl =
    process.env.PUBLIC_SITE_REVALIDATE_URL?.trim();

  if (!revalidationUrl) {
    return {
      skipped: true,
      status: null,
      body:
        "PUBLIC_SITE_REVALIDATE_URL is not configured.",
    };
  }

  const secret =
    process.env
      .PUBLIC_SITE_REVALIDATE_SECRET?.trim() ??
    "";

  const response = await fetch(
    revalidationUrl,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        ...(secret
          ? {
              Authorization:
                `Bearer ${secret}`,
            }
          : {}),
      },

      body: JSON.stringify(payload),

      cache: "no-store",
    },
  );

  const responseBody =
    await response.text();

  if (!response.ok) {
    throw new Error(
      [
        "Public-site revalidation failed.",
        `Status: ${response.status}.`,
        responseBody
          ? `Response: ${responseBody.slice(0, 500)}`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  return {
    skipped: false,
    status: response.status,
    body: responseBody.slice(0, 5_000),
  };
}