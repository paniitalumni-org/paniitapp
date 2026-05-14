import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/agenda");
  } catch (err) {
    rethrowIfRedirect(err);
    // env not configured yet — let the form render
  }
  return <LoginForm />;
}
