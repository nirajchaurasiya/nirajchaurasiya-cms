import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const metadata: Metadata = {
  title: "Private Login",

  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  async function loginWithGitHub() {
    "use server";

    await signIn("github", {
      redirectTo: "/dashboard",
    });
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-card__mark">NC</div>

        <p className="dashboard-eyebrow">Private control system</p>

        <h1>
          Analytics and publishing
          <span>for the public knowledge system.</span>
        </h1>

        <p className="login-card__description">
          Access is restricted to the authorized GitHub owner account.
        </p>

        <form action={loginWithGitHub}>
          <button type="submit">
            {/* <Github
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            /> */}
            <svg
              xmlns="http://w3.org"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            Continue with GitHub
          </button>
        </form>

        <div className="login-card__security">
          <LockKeyhole size={16} strokeWidth={1.8} aria-hidden="true" />

          <span>No public registration or password login.</span>
        </div>
      </section>
    </main>
  );
}
