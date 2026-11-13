import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Opens a material's Drive link. RLS only returns the row if the signed-in
 * user's batch matches (or they are staff), so other batches get a 404.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/app/materials")}`, request.url));
  }

  const { data } = await supabase.from("materials").select("url").eq("id", id).maybeSingle();
  if (!data || !data.url.startsWith("https://")) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.redirect(data.url, { status: 302, headers: { "Cache-Control": "no-store" } });
}
