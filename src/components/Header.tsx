import { cn } from "@/lib/utils";

interface HeaderProps {
  currentPath?: string;
}

const navItems = [
  { href: "/", label: "Home", match: (path: string) => path === "/" },
  {
    href: "/tools/face-mosaic",
    label: "Tools",
    match: (path: string) => path.startsWith("/tools"),
  },
];

function Header({ currentPath = "/" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <a
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-slate-100 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-indigo-400"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          高校情報
        </a>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                item.match(currentPath)
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export { Header };
