// リンクカード。トップページとツール一覧で共通に使う。
//
// 以前はこの markup がトップページに16回コピーされていて、ホバー時の枠線色や
// アイコンの文字色がカードごとに違っていた。
//
// メインサイト(koukou-jouhou)の src/components/LinkCard.astro と同じ見た目。
// 変えるときは両方を直すこと。
//
// アイコンのアクセント色は accent(16進1色)だけを受け取り、文字色は
// color-mix で作る(.icon-chip / global.css)。Tailwind のクラス名を
// 動的に組み立てると静的走査から漏れて CSS が出力されないため。

interface LinkCardProps {
  href: string;
  label: string;
  desc?: string;
  /** インライン SVG の文字列。省略するとアイコン枠ごと出さない */
  icon?: string;
  /** アクセント色（例 "#6366f1"）。省略時はブランドの indigo */
  accent?: string;
  /** 使う人での絞り込み用。data 属性として出し、絞り込みは素の JS が行う */
  audience?: "student" | "teacher" | "both";
  /**
   * 見出しの上に出す小さな印（「共有・送信あり」など）。
   * **付けるのは確かめられたものだけ。** 印が無い＝端末の中だけ、という
   * 読み方になるので、当てずっぽうで付けない。
   */
  badge?: string;
}

export function LinkCard({
  href,
  label,
  desc,
  icon,
  accent = "#6366f1",
  audience,
  badge,
}: LinkCardProps) {
  return (
    <a
      href={href}
      data-tool
      data-audience={audience}
      className="group block rounded-xl border border-slate-300 bg-white p-6 shadow-sm transition-all hover:border-indigo-500/50 hover:bg-slate-100 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none dark:hover:border-indigo-400/50 dark:hover:bg-slate-900"
    >
      {icon && (
        <div className="icon-chip" style={{ "--chip": accent } as React.CSSProperties}>
          <span className="block h-5 w-5" dangerouslySetInnerHTML={{ __html: icon }} />
        </div>
      )}
      {badge && (
        <p className="mb-1 inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
          {badge}
        </p>
      )}
      <h3 className="mb-1 font-semibold leading-snug text-slate-900 dark:text-slate-100">{label}</h3>
      {desc && <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>}
    </a>
  );
}

export default LinkCard;
