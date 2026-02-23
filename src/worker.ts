interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY: string;
  RESEND_TO_EMAIL: string;
  RESEND_FROM_EMAIL?: string;
}

interface SupportRequestBody {
  email?: string;
  content?: string;
  category?: string;
}

const SUPPORT_PATH = "/api/support";

async function handleSupportRequest(request: Request, env: Env): Promise<Response> {
  let body: SupportRequestBody;

  try {
    body = (await request.json()) as SupportRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const category = body.category?.trim() ?? "";
  const content = body.content?.trim() ?? "";
  const email = body.email?.trim() ?? "";

  if (!category) {
    return Response.json({ error: "category is required" }, { status: 400 });
  }

  if (!content) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  const fromEmail = env.RESEND_FROM_EMAIL?.trim() || "noreply@resend.dev";

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `機能リクエスト <${fromEmail}>`,
      to: env.RESEND_TO_EMAIL,
      reply_to: email || undefined,
      subject: `問い合わせフォームより：${category}`,
      text: [
        `カテゴリ: ${category}`,
        `返信先: ${email || "（未入力）"}`,
        "",
        "--- 内容 ---",
        content,
      ].join("\n"),
    }),
  });

  if (!resendResponse.ok) {
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }

  return Response.json({ success: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === SUPPORT_PATH) {
      return handleSupportRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
