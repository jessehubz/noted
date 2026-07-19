import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "jdfrancisco5@up.edu.ph")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ userId: null, isAdmin: false });

  const user = await currentUser();
  const emails = user?.emailAddresses?.map((e) => e.emailAddress?.toLowerCase()) ?? [];
  const isAdmin = emails.some((email) => email && ADMIN_EMAILS.includes(email));

  return NextResponse.json({ userId, isAdmin });
}
