import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "jdfrancisco5@up.edu.ph").split(",").map((e) => e.trim().toLowerCase());

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userEmails = user?.emailAddresses?.map((e) => e.emailAddress?.toLowerCase()) ?? [];
  const isAdmin = userEmails.some((email) => email && ADMIN_EMAILS.includes(email));
  if (!isAdmin) redirect("/");

  return (
    <div className="admin-shell">
      <nav className="admin-nav">
        <Link href="/admin" className="admin-brand">noted <span className="admin-badge">admin</span></Link>
        <div className="admin-nav-links">
          <Link href="/admin" className="admin-nav-link">Overview</Link>
          <Link href="/admin/notes" className="admin-nav-link">Notes</Link>
          <Link href="/admin/flagged" className="admin-nav-link">Flagged</Link>
          <Link href="/admin/users" className="admin-nav-link">Users</Link>
          <Link href="/admin/map" className="admin-nav-link">Map View</Link>
          <Link href="/map" className="admin-nav-link admin-nav-link--dim">← Back to app</Link>
        </div>
      </nav>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
