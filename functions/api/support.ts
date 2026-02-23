/// <reference types="@cloudflare/workers-types" />

interface Env {
  RESEND_API_KEY: string;
  SUPPORT_EMAIL: string;
}

interface SupportRequestBody {
  email?: string;
  content?: string;
  category?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `機能リクエスト <noreply@${new URL(request.url).hostname}>`,
      to: env.SUPPORT_EMAIL,
      reply_to: email || undefined,
      subject: `[機能リクエスト] ${category}`,
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
};
