import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "quick-login",
      name: "Google Quick Sign In",
      credentials: {
        name: { label: "Nama Lengkap", type: "text" },
        email: { label: "Email Google", type: "email" },
        image: { label: "Foto Profil / Avatar", type: "text" },
        role: { label: "Role (teacher / student)", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials) return null;
        return {
          id: credentials.email || `user-${Date.now()}`,
          name: credentials.name || "Siswa Ceria",
          email: credentials.email || "siswa@gmail.com",
          image: credentials.image || "https://api.dicebear.com/7.x/bottts/svg?seed=siswa",
          role: credentials.role || "student"
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || "student";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = (token.role as string) || "student";
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "playful-quiz-secret-key-999-super-secure",
  pages: {
    signIn: "/auth/signin"
  }
};
