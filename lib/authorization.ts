import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

function getAllowedLogin() {
  return process.env
    .AUTH_ALLOWED_GITHUB_LOGIN
    ?.trim()
    .toLowerCase();
}

export async function requireOwner() {
  const session = await auth();
  const allowedLogin = getAllowedLogin();

  if (
    !session?.user ||
    !allowedLogin ||
    session.user.githubLogin
      .trim()
      .toLowerCase() !== allowedLogin
  ) {
    redirect("/login");
  }

  return session;
}

export async function getAuthorizedOwner() {
  const session = await auth();
  const allowedLogin = getAllowedLogin();

  if (
    !session?.user ||
    !allowedLogin ||
    session.user.githubLogin
      .trim()
      .toLowerCase() !== allowedLogin
  ) {
    return null;
  }

  return session;
}