"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MONTHS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { version } from "@/package.json";

type Props = { slug: string; counts?: Record<string, number> };

export function MonthSidebar({ slug, counts = {} }: Props) {
  const params = useParams<{ month: string }>();
  const activeMonth = params.month;
  const year = new Date().getFullYear();
  const total = Object.values(counts).reduce((s, v) => s + v, 0);

  return (
    <aside className="flex flex-col border-r border-border bg-card shrink-0 w-40">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground/60">
            {year}
          </p>
          <span className="text-[10px] font-mono font-semibold text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded select-none">v{version}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className="font-semibold text-foreground tabular-nums">{total}</span>{" "}
          منشور
        </p>
      </div>

      {/* Month list */}
      <nav className="flex flex-col gap-0.5 px-2 py-2 overflow-y-auto flex-1 min-h-0">
        {MONTHS.map((m) => {
          const count = counts[m.value] ?? 0;
          const isActive = activeMonth === m.value;
          return (
            <Link
              key={m.value}
              href={`/clients/${slug}/calendar/${m.value}`}
              className={cn(
                "group flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-all duration-100 select-none",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : count > 0
                  ? "text-foreground/80 hover:bg-muted hover:text-foreground"
                  : "text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground",
              )}
            >
              <span className="truncate">{m.labelEn}</span>
              {count > 0 ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 text-[10px] font-bold tabular-nums leading-5 min-w-5 text-center",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                  )}
                >
                  {count}
                </span>
              ) : (
                <span className="h-1 w-1 rounded-full bg-border shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
