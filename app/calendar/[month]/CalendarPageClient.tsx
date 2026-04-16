"use client";

import type { ReactElement } from "react";
import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/app/components/ui/sonner";
import { CalendarTable } from "./CalendarTable";
import { deleteEntry, getEntriesByMonth } from "@/app/actions/entries";
import type { EntryListItem } from "@/app/actions/entries";
import type { MonthValue } from "@/lib/constants";

type Props = {
  month: MonthValue;
  monthLabel: string;
  initialEntries: EntryListItem[];
};

export function CalendarPageClient({
  month,
  monthLabel,
  initialEntries,
}: Props): ReactElement {
  const router = useRouter();
  const [entries, setEntries] = useState<EntryListItem[]>(initialEntries);
  const [loading, startLoading] = useTransition();

  const reload = useCallback(() => {
    startLoading(async () => {
      const fresh = await getEntriesByMonth(month);
      setEntries(fresh);
      router.refresh();
    });
  }, [month, router]);

  const handleDelete = async (id: string): Promise<void> => {
    const result = await deleteEntry(id);
    if (result.success) {
      toast.success("تم حذف المحتوى");
      reload();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <CalendarTable
      entries={entries}
      month={month}
      monthLabel={monthLabel}
      loading={loading}
      onDelete={handleDelete}
    />
  );
}
