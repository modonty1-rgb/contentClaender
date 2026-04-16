"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MONTHS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  counts?: Record<string, number>;
};

export function MonthTabs({ slug, counts = {} }: Props) {
  const params = useParams<{ month: string }>();
  const activeMonth = params.month;

  return (
    <div className="overflow-x-auto border-b border-border bg-card">
      <div className="flex min-w-max gap-1 px-4 py-2">
        {MONTHS.map((m) => {
          const count = counts[m.value] ?? 0;
          const isActive = activeMonth === m.value;
          return (
            <Link
              key={m.value}
              href={`/clients/${slug}/calendar/${m.value}`}
              className={cn(
                "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {m.label}
              {count > 0 && (
                <span
                  className={cn(
                    "absolute -top-1.5 -left-1 min-w-4.5 h-4.5 rounded-full px-1 text-[10px] font-bold leading-4.5 text-center",
                    isActive
                      ? "bg-primary-foreground text-primary"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
