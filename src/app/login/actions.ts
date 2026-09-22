"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const clean = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const fail = (mode: "signin" | "signup", msg: string): never =>
  redirect(`/login?mode=${mode}&error=${encodeURIComponent(msg)}`);

export async function signIn(fd: FormData) {
  const email = clean(fd.get("email"));
  const password = clean(fd.get("password"));
  if (!email || !password) fail("signin", "Enter your email and password.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) fail("signin", "That email and password do not match.");
  redirect("/today");
}

export async function signUp(fd: FormData) {
  const studio = clean(fd.get("studio"));
  const email = clean(fd.get("email"));
  const password = clean(fd.get("password"));
  if (!studio) fail("signup", "Enter your studio name.");
  if (!email) fail("signup", "Enter your email.");
  if (password.length < 8) fail("signup", "Use a password with at least 8 characters.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { studio_name: studio } },
  });
  if (error) fail("signup", error.message);

  // With email confirmation switched on in Supabase there is no session yet.
  if (!data.session) {
    redirect(
      `/login?mode=signin&notice=${encodeURIComponent("Account created. Check your email to confirm it, then sign in.")}`,
    );
  }
  redirect("/today");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
