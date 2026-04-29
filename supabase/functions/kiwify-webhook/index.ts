import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://vfmtntdaohuwitajxyqc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbXRudGRhb2h1d2l0YWp4eXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc4ODI5OSwiZXhwIjoyMDkyMzY0Mjk5fQ.uMarVb3dj3MQ0GSsMZArlARUrF6m2I-4aDUe_Kz3lv8";
const LOWTICKET_PRODUCT_ID = "60541fc0-3def-11f1-ab4b-95e1193d73e9";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

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
  const customer = body["Customer"] as Record<string, string> | undefined;
  const email = customer?.["email"];

  // --- REEMBOLSO: bloqueia acesso do aluno ---
  if (orderStatus === "refunded") {
    if (!email) {
      return new Response(JSON.stringify({ error: "Missing customer email" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status: "inativo" })
      .eq("email", email);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, action: "deactivated", email }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (orderStatus !== "paid") {
    return new Response(JSON.stringify({ ignored: true, order_status: orderStatus }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const name = customer?.["name"] ?? "";

  if (!email) {
    return new Response(JSON.stringify({ error: "Missing customer email" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- BUSCA DE USUÁRIO: direto na tabela profiles pelo email ---
  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profileLookupError) {
    return new Response(JSON.stringify({ error: profileLookupError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let userId: string;
  let isNewUser = false;

  if (existingProfile) {
    userId = existingProfile.id;
  } else {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createError) {
      // Usuário existe no auth mas não tem perfil — busca o ID pelo email
      if (createError.message.toLowerCase().includes("already")) {
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          return new Response(JSON.stringify({ error: listError.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        const found = listData.users.find((u) => u.email === email);
        if (!found) {
          return new Response(JSON.stringify({ error: "User not found after creation conflict" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        userId = found.id;
      } else {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      userId = created.user.id;
      isNewUser = true;
    }
  }

  // Upsert profile
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      nome: name,
      plano: "lowticket",
      status: "ativo",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- E-MAIL DE BOAS-VINDAS: apenas para novos usuários ---
  if (isNewUser) {
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo: "https://4ppatrimonial.com.br" },
    });

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const actionLink = inviteData.properties?.action_link;
    const firstName = name.split(" ")[0] || "aluno(a)";

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "4P Patrimonial <contato@4ppatrimonial.com.br>",
        to: [email],
        subject: "Seu acesso ao 4P Patrimonial está pronto!",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
            <h2>Olá, ${firstName}!</h2>
            <p>Seu acesso à plataforma <strong>4P Patrimonial</strong> está pronto.</p>
            <p>Clique no botão abaixo para criar sua senha e começar a acessar o conteúdo:</p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${actionLink}"
                style="background-color:#2563eb;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">
                Criar minha senha e acessar
              </a>
            </div>
            <p style="color:#555;">
              Após criar sua senha, você poderá entrar a qualquer momento em
              <a href="https://4ppatrimonial.com.br">4ppatrimonial.com.br</a>.
            </p>
            <p style="color:#555;">Se você não reconhece esta compra, ignore este e-mail.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#999;font-size:12px;">4P Patrimonial — Método de investimento patrimonial</p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      return new Response(JSON.stringify({ error: `Email send failed: ${errText}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(
    JSON.stringify({ success: true, user_id: userId, email, is_new_user: isNewUser }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
