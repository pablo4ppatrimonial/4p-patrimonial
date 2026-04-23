import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://vfmtntdaohuwitajxyqc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbXRudGRhb2h1d2l0YWp4eXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc4ODI5OSwiZXhwIjoyMDkyMzY0Mjk5fQ.uMarVb3dj3MQ0GSsMZArlARUrF6m2I-4aDUe_Kz3lv8";
const LOWTICKET_PRODUCT_ID = "60541fc0-3def-11f1-ab4b-95e1193d73e9";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const orderStatus = body["order_status"] as string | undefined;
  if (orderStatus !== "paid") {
    return new Response(JSON.stringify({ ignored: true, order_status: orderStatus }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const customer = body["Customer"] as Record<string, string> | undefined;
  const email = customer?.["email"];
  const name = customer?.["name"] ?? "";

  if (!email) {
    return new Response(JSON.stringify({ error: "Missing customer email" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create or retrieve user in Supabase Auth
  let userId: string;
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    return new Response(JSON.stringify({ error: listError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existing = existingUsers?.users?.find((u) => u.email === email);

  if (existing) {
    userId = existing.id;
  } else {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    userId = created.user.id;
  }

  // Upsert profile with lowticket plan
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: name,
      plano: "lowticket",
      produto_id: LOWTICKET_PRODUCT_ID,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Send magic link
  const { error: magicLinkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: "https://4ppatrimonial.com.br/auth.html",
    },
  });

  if (magicLinkError) {
    return new Response(JSON.stringify({ error: magicLinkError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, user_id: userId, email }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
