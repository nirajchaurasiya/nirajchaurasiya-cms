import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

function readGitHubLogin(profile: unknown) {
  if (
    typeof profile !== "object" ||
    profile === null
  ) {
    return null;
  }

  const login = Reflect.get(profile, "login");

  return typeof login === "string"
    ? login.trim().toLowerCase()
    : null;
}

const allowedGitHubLogin =
  process.env.AUTH_ALLOWED_GITHUB_LOGIN
    ?.trim()
    .toLowerCase() ?? "";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [GitHub],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },

  callbacks: {
    async signIn({
      account,
      profile,
    }) {
      if (
        account?.provider !== "github" ||
        !allowedGitHubLogin
      ) {
        return false;
      }

      const login = readGitHubLogin(profile);

      return login === allowedGitHubLogin;
    },

    async jwt({
      token,
      profile,
    }) {
      const githubLogin =
        readGitHubLogin(profile);

      if (githubLogin) {
        token.githubLogin = githubLogin;
      }

      token.role = "OWNER";

      return token;
    },

    async session({
      session,
      token,
    }) {
      if (session.user) {
        session.user.id = token.sub ?? "";

        session.user.githubLogin =
          typeof token.githubLogin === "string"
            ? token.githubLogin
            : "";

        session.user.role = "OWNER";
      }

      return session;
    },

    authorized({
      auth: session,
    }) {
      return Boolean(
        session?.user?.githubLogin ===
          allowedGitHubLogin,
      );
    },
  },
});