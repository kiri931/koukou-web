// セクションの見出し。メインサイト(koukou-jouhou)の SectionHeading.astro と揃えてある。
//
// 以前は `STUDY` `TOOLS` `SUPPORT` という英大文字の見出しだった。
// 日本語サイトで中身を表さないうえ、スクリーンリーダーが1文字ずつ
// 読み上げることがあるので使わない。

interface SectionHeadingProps {
  title: string;
  desc?: string;
}

export function SectionHeading({ title, desc }: SectionHeadingProps) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      {desc && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{desc}</p>}
    </div>
  );
}

export default SectionHeading;
