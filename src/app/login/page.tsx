import Link from "next/link";
import { isConfigured } from "@/lib/supabase/server";
import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; notice?: string }>;
}) {
  const { mode, error, notice } = await searchParams;
  const signup = mode === "signup";

  if (!isConfigured()) {
    return (
      <div className="auth">
        <h1>Studio Desk</h1>
        <div className="panel" style={{ padding: 18 }}>
          <p style={{ marginTop: 0 }}>
            <strong>Setup needed.</strong> Copy <span className="code">.env.example</span> to{" "}
            <span className="code">.env.local</span>, add your Supabase URL and anon key, then restart the app.
          </p>
          <p className="hint" style={{ marginBottom: 0 }}>
            The README has the full steps, including the database script to run in Supabase.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <p className="eyebrow">For makeup artists</p>
      <h1>Studio Desk</h1>
      <p className="lede">
        {signup
          ? "Create your studio. Bookings, students and enquiries in one place."
          : "Sign in to your studio."}
      </p>

      <div className="panel">
        {error ? <div className="banner bad" style={{ marginTop: 0, marginBottom: 14 }}>{error}</div> : null}
        {notice ? <div className="banner info" style={{ marginTop: 0, marginBottom: 14 }}>{notice}</div> : null}

        <form action={signup ? signUp : signIn}>
          {signup ? (
            <div className="fld">
              <label htmlFor="studio">Studio name</label>
              <input id="studio" name="studio" required autoComplete="organization" placeholder="Aditi Makeup Studio" />
            </div>
          ) : null}
          <div className="fld">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="fld">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={signup ? 8 : undefined}
              autoComplete={signup ? "new-password" : "current-password"}
            />
          </div>
          <button className="btn primary" type="submit" style={{ width: "100%" }}>
            {signup ? "Create my studio" : "Sign in"}
          </button>
        </form>

        <p className="switch">
          {signup ? (
            <>
              Already have a studio? <Link href="/login?mode=signin">Sign in</Link>
            </>
          ) : (
            <>
              New here? <Link href="/login?mode=signup">Create a studio</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
