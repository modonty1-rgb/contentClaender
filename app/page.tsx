import Link from "next/link";
import { Calendar, Sparkles, Archive } from "lucide-react";
import { getClients, getArchivedClients } from "@/app/actions/clients";
import { ClientsView } from "@/app/components/ClientsView";
import { version } from "@/package.json";

export default async function DashboardPage() {
  const [clients, archived] = await Promise.all([
    getClients(),
    getArchivedClients(),
  ]);

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-5 shadow-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">مدير المحتوى</h1>
            <p className="text-sm text-muted-foreground mt-0.5">أدِر محتوى عملاءك في مكان واحد</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded-full border border-border">
              v{version}
            </span>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{clients.length} عميل</span>
            </div>
            <Link
              href="/archive"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:text-foreground hover:bg-muted transition-colors"
            >
              <Archive className="h-3.5 w-3.5" />
              الأرشيف
              {archived.length > 0 && (
                <span className="tabular-nums bg-muted text-muted-foreground text-[10px] font-bold rounded-full min-w-4 text-center leading-4 px-1">
                  {archived.length}
                </span>
              )}
            </Link>
            <Link
              href="/flow"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:text-foreground hover:bg-muted transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              سير العمل
            </Link>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="mx-auto max-w-7xl p-4">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-5xl">📋</div>
            <p className="text-lg font-semibold text-foreground">لا يوجد عملاء بعد</p>
            <p className="text-sm text-muted-foreground">ابدأ بإضافة أول عميل من الزر أدناه</p>
          </div>
        ) : (
          <ClientsView clients={clients} />
        )}
      </main>
    </div>
  );
}
