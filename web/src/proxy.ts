import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_DEMO, DEMO_COOKIE, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// Keeps the admin's Supabase session fresh and sends signed-out visitors to
// the login page. The real admin check (the `admins` table) runs in each
// admin page and server action via requireAdmin().
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  // Demo mode: the pretend login sets a cookie; without it, back to the login.
  if (ADMIN_DEMO) {
    if (!isLoginPage && !request.cookies.has(DEMO_COOKIE)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
