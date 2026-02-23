import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormStatus = "idle" | "submitting" | "success" | "error";

const categories = [
  "バグ報告",
  "機能追加リクエスト",
  "改善提案",
  "その他",
] as const;

export function SupportForm() {
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  const isSubmitting = status === "submitting";

  const resetFeedback = () => {
    if (status !== "submitting") {
      setStatus("idle");
      setMessage("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!category) {
      setStatus("error");
      setMessage("カテゴリを選択してください。");
      return;
    }

    if (!content.trim()) {
      setStatus("error");
      setMessage("リクエスト内容を入力してください。");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          content: content.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "送信に失敗しました。");
      }

      setStatus("success");
      setMessage("機能リクエストを送信しました。ありがとうございます。");
      setCategory("");
      setContent("");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "送信に失敗しました。時間をおいて再度お試しください。"
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          機能リクエスト
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          追加してほしい機能や改善案をお送りください。必要に応じて返信します。
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="support-category">カテゴリ</Label>
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value);
              resetFeedback();
            }}
          >
            <SelectTrigger
              id="support-category"
              aria-invalid={status === "error" && !category}
            >
              <SelectValue placeholder="カテゴリを選択してください" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="support-content">リクエスト内容</Label>
          <textarea
            id="support-content"
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              resetFeedback();
            }}
            rows={8}
            required
            aria-invalid={status === "error" && !content.trim()}
            placeholder="改善してほしい点、追加したい機能、利用シーンなどを入力してください。"
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 flex min-h-32 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="support-email">返信用メール（任意）</Label>
          <Input
            id="support-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              resetFeedback();
            }}
            placeholder="you@example.com"
          />
        </div>

        {status === "success" && (
          <Alert>
            <AlertTitle>送信完了</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertTitle>送信エラー</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "送信中..." : "送信する"}
          </Button>
        </div>
      </form>
    </div>
  );
}
