import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** Debug endpoint: returns the current user's email as Clerk sees it.
 *  Access at /api/me when signed in to verify your admin email. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const user = await currentUser();
  const emails = user?.emailAddresses?.map((e) => e.emailAddress) ?? [];

  return NextResponse.json({
    userId,
    emails,
    primaryEmail: emails[0] ?? null,
    adminEmails: (process.env.ADMIN_EMAILS ?? "jdfrancisco5@up.edu.ph").split(",").map((e) => e.trim()),
  });
}
