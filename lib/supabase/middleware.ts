import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routeAccess, type Role } from "@/lib/auth/routes";
import type { Database } from "./database.types";

/** Refreshes the auth session cookie and enforces role-based route access. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: Role | null = null;
  if (user) {
    const { data } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
    role = (data?.role as Role | undefined) ?? null;
  }

  const access = routeAccess(request.nextUrl.pathname, role);
  if (!access.allow) {
    const redirect = NextResponse.redirect(new URL(access.redirect, request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}
