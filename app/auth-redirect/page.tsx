import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "jdfrancisco5@up.edu.ph").split(",").map((e) => e.trim().toLowerCase());

export default async function AuthRedirectPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const userEmails = user?.emailAddresses?.map((e) => e.emailAddress?.toLowerCase()) ?? [];
  const isAdmin = userEmails.some((email) => email && ADMIN_EMAILS.includes(email));

  if (isAdmin) {
    redirect("/admin");
  }

  redirect("/map");
}
