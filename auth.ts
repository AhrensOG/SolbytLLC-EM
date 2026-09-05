import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { User } from "@/lib/models";
import { createUserWithDefaults } from "@/lib/user-setup";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        const user = await User.findOne({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = (
          (typeof profile?.email === "string" ? profile.email : user.email) ??
          ""
        )
          .trim()
          .toLowerCase();
        if (!email) return false;

        const name =
          typeof profile?.name === "string" ? profile.name : (user.name ?? "");
        const image =
          typeof profile?.picture === "string" ? profile.picture : null;
        const providerAccountId = account.providerAccountId ?? email;

        const existing = await User.findOne({ where: { email } });
        if (existing) {
          await existing.update({
            provider: "google",
            providerId: existing.providerId ?? providerAccountId,
            image: image ?? existing.image,
          });
          user.id = existing.id;
          user.name = existing.name;
          user.email = existing.email;
        } else {
          const created = await createUserWithDefaults({
            name: name || email.split("@")[0],
            email,
            provider: "google",
            providerId: providerAccountId,
            image,
          });
          user.id = created.id;
          user.name = created.name;
          user.email = created.email;
        }
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
