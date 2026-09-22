import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { requireContext } from "@/lib/auth";
import { isConfigured } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isConfigured()) redirect("/login");
  const ctx = await requireContext();

  if (!ctx.studio) {
    return (
      <div className="app">
        <main>
          <div className="banner bad">
            Your account has no studio yet. Run <span className="code">supabase/schema.sql</span> in the Supabase SQL
            editor, then create a new account.
          </div>
        </main>
      </div>
    );
  }

  const { count } = await ctx.supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", ctx.studio.id)
    .eq("status", "new");

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow">
            {new Intl.DateTimeFormat("en-IN", {
              timeZone: "Asia/Kolkata",
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </p>
          <h1>{ctx.studio.name}</h1>
        </div>
        <form action={signOut}>
          <button className="signout" type="submit">
            Sign out
          </button>
        </form>
      </header>
      <Nav newLeads={count ?? 0} />
      <main>{children}</main>
    </div>
  );
}
