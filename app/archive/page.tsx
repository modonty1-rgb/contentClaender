import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getArchivedClients } from "@/app/actions/clients";
import { MONTHS } from "@/lib/constants";
import { UnarchiveClientButton } from "@/app/components/UnarchiveClientButton";
import { DeleteClientButton } from "@/app/components/DeleteClientButton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/app/components/ui/table";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = { social: "وسائل تواصل", article: "مقالات" };

function monthLabel(v: string | undefined): string {
  if (!v) return "—";
  return MONTHS.find((m) => m.value === v)?.label ?? v;
}

export default async function ArchivePage() {
  const clients = await getArchivedClients();

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <header className="border-b border-border bg-card px-6 py-5 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1 transition-colors -mx-2"
            >
              <ArrowRight className="h-4 w-4" />
              الرئيسية
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">الأرشيف</h1>
              <p className="text-sm text-muted-foreground mt-0.5">العملاء المؤرشفون — استرجاع أو حذف نهائي</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {clients.length} عميل مؤرشف
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-5xl">📁</div>
            <p className="text-lg font-semibold text-foreground">الأرشيف فارغ</p>
            <p className="text-sm text-muted-foreground">لم يتم أرشفة أي عميل بعد</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-10 h-10 py-2 px-3"></TableHead>
                  <TableHead className="h-10 py-2 px-3 text-xs">الاسم</TableHead>
                  <TableHead className="w-32 h-10 py-2 px-3 text-xs text-center">النوع</TableHead>
                  <TableHead className="w-24 h-10 py-2 px-3 text-xs text-center">منشورات</TableHead>
                  <TableHead className="w-20 h-10 py-2 px-3 text-xs text-center">شهور</TableHead>
                  <TableHead className="w-28 h-10 py-2 px-3 text-xs text-center">آخر شهر</TableHead>
                  <TableHead className="w-32 h-10 py-2 px-3 text-xs text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => {
                  const lastMonth = c.activeMonths[c.activeMonths.length - 1];
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/40">
                      <TableCell className="p-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                      </TableCell>
                      <TableCell className="p-3 font-semibold text-foreground">{c.name}</TableCell>
                      <TableCell className="p-3 text-center">
                        <span className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          c.type === "article"
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
                        )}>
                          {TYPE_LABEL[c.type] ?? c.type}
                        </span>
                      </TableCell>
                      <TableCell className="p-3 text-center tabular-nums text-foreground">{c.totalEntries}</TableCell>
                      <TableCell className="p-3 text-center tabular-nums text-foreground">{c.activeMonths.length}</TableCell>
                      <TableCell className="p-3 text-center text-muted-foreground">{monthLabel(lastMonth)}</TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <UnarchiveClientButton clientId={c.id} clientName={c.name} />
                          <DeleteClientButton clientId={c.id} clientName={c.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
