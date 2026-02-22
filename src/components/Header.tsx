import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  currentPath?: string;
}

const toolMenuSections = [
  {
    label: "STUDY",
    items: [
      { href: "/tools/typing-japanese", label: "タイピング練習" },
      { href: "/study/equation-transformation/", label: "等式の変形テスト" },
      { href: "/tools/presentation", label: "プレゼンガイド" },
      { href: "/tools/pdf-viewer", label: "PDF参照モード" },
      { href: "/tools/time-schedule", label: "タイムスケジューラ" },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { href: "/tools/face-mosaic", label: "顔モザイクツール" },
      { href: "/tools/pdf-merge", label: "PDFマージ" },
    ],
  },
  {
    label: "SUPPORT",
    items: [{ href: "/tools/sekigae", label: "席替えアプリ サポート" }],
  },
] as const;

const navItems = [
  { href: "/", label: "Home", match: (path: string) => path === "/" },
  {
    href: "/tools/",
    label: "Tools",
    match: (path: string) => path.startsWith("/tools") || path.startsWith("/study"),
  },
];

const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";

function Header({ currentPath = "/" }: HeaderProps) {
  const normalizedCurrentPath = normalizePath(currentPath);
  const [toolsOpen, setToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setToolsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <a
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-slate-900 transition-colors hover:text-slate-700 dark:text-slate-100 dark:hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-indigo-500 dark:text-indigo-400"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          高校情報
        </a>
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1">
            {navItems.map((item) =>
              item.label === "Tools" ? (
                <div key={item.href} className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setToolsOpen(!toolsOpen)}
                    aria-haspopup="true"
                    aria-expanded={toolsOpen}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      item.match(normalizedCurrentPath)
                        ? "bg-slate-900 text-white dark:bg-slate-800"
                        : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                    )}
                  >
                    {item.label}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cn("h-3.5 w-3.5 transition-transform", toolsOpen && "rotate-180")}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {toolsOpen && (
                    <div className="absolute left-0 top-full z-50 pt-2">
                      <div className="w-[min(92vw,24rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
                        <div className="grid gap-4 grid-cols-1">
                          {toolMenuSections.map((section) => (
                            <div key={section.label}>
                              <p className="mb-2 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                                {section.label}
                              </p>
                              <div className="space-y-1">
                                {section.items.map((menuItem) => (
                                  <a
                                    key={menuItem.href}
                                    href={menuItem.href}
                                    onClick={() => setToolsOpen(false)}
                                    className={cn(
                                      "block rounded-md px-2 py-1.5 text-sm transition-colors",
                                      normalizedCurrentPath === normalizePath(menuItem.href)
                                        ? "bg-slate-900 text-white dark:bg-slate-800"
                                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                    )}
                                  >
                                    {menuItem.label}
                                  </a>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    item.match(normalizedCurrentPath)
                      ? "bg-slate-900 text-white dark:bg-slate-800"
                      : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                  )}
                >
                  {item.label}
                </a>
              )
            )}
          </nav>
          <button
            type="button"
            data-theme-toggle
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="ライト/ダークを切り替え"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 dark:hidden">
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2"></path>
              <path d="M12 20v2"></path>
              <path d="m4.93 4.93 1.41 1.41"></path>
              <path d="m17.66 17.66 1.41 1.41"></path>
              <path d="M2 12h2"></path>
              <path d="M20 12h2"></path>
              <path d="m6.34 17.66-1.41 1.41"></path>
              <path d="m19.07 4.93-1.41 1.41"></path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="hidden h-4 w-4 dark:block">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export { Header };
