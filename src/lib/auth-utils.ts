// Auth utility functions for API routes
import { auth, clientPromise } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function checkAuth() {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, message: "Authentication required. Please sign in to continue." },
        { status: 401 }
      ),
      session: null,
      dbUser: null,
    };
  }

  const client = await clientPromise;
  const db = client.db();
  const dbUser = await db.collection("users").findOne({ email: session.user.email });

  if (dbUser?.isBlocked) {
    return {
      error: NextResponse.json(
        { success: false, message: "Your account has been blocked. Please contact support." },
        { status: 403 }
      ),
      session: null,
      dbUser: null,
    };
  }

  return { error: null, session, dbUser };
}

export async function checkAdmin() {
  const result = await checkAuth();
  if (result.error) return result;

  if (!result.dbUser || !["admin", "superadmin"].includes(result.dbUser.role)) {
    return {
      error: NextResponse.json(
        { success: false, message: "Admin access required. You do not have permission to perform this action." },
        { status: 403 }
      ),
      session: result.session,
      dbUser: result.dbUser,
    };
  }

  return result;
}

export async function checkSuperAdmin() {
  const result = await checkAuth();
  if (result.error) return result;

  if (!result.dbUser || result.dbUser.role !== "superadmin") {
    return {
      error: NextResponse.json(
        { success: false, message: "Super admin access required." },
        { status: 403 }
      ),
      session: result.session,
      dbUser: result.dbUser,
    };
  }

  return result;
}
