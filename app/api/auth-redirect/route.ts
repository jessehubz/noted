import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "jdfrancisco5@up.edu.ph").split(",").map((e) => e.trim().toLowerCase());

/**
 * After sign-in, Clerk redirects here. We check if the user is an admin
 * and send them to /admin, otherwise /map.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "https://localhost:3000" : "http://localhost:3000"));

  const user = await currentUser();
  const userEmails = user?.emailAddresses?.map((e) => e.emailAddress?.toLowerCase()) ?? [];
  const isAdmin = userEmails.some((email) => email && ADMIN_EMAILS.includes(email));

  if (isAdmin) {
    return NextResponse.redirect(new URL("/admin", getBaseUrl()));
  }
  return NextResponse.redirect(new URL("/map", getBaseUrl()));
}

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
