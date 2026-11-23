import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient, type MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dummy_for_build";

const mongoOptions: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 10000,
  serverSelectionTimeoutMS: 5000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, mongoOptions);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // Fetch role from our User model
        const client = await clientPromise;
        const db = client.db();
        const dbUser = await db.collection("users").findOne({ email: user.email });
        if (dbUser) {
          (session.user as any).role = dbUser.role || "user";
          (session.user as any).phone = dbUser.phone;
          (session.user as any).isBlocked = dbUser.isBlocked || false;
        }
      }
      return session;
    },
    async signIn({ user }) {
      // Check if user is blocked
      const client = await clientPromise;
      const db = client.db();
      const dbUser = await db.collection("users").findOne({ email: user.email });
      if (dbUser?.isBlocked) {
        return false; // Block sign-in
      }

      // Set default role if new user
      if (!dbUser) {
        // New user - check if they should be super admin
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
        if (superAdminEmail && user.email === superAdminEmail) {
          // Will be set after creation via the adapter
          setTimeout(async () => {
            await db.collection("users").updateOne(
              { email: user.email },
              { $set: { role: "superadmin", isBlocked: false } }
            );
          }, 1000);
        }
      }

      return true;
    },
  },
});

export { clientPromise };
