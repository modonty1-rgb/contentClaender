import Link from "next/link";
import { Calendar, Sparkles } from "lucide-react";
import { getClients } from "@/app/actions/clients";
import { NewClientDialog } from "@/app/components/NewClientDialog";
import { DeleteClientButton } from "@/app/components/DeleteClientButton";
import { EditClientButton } from "@/app/components/EditClientButton";
import { MONTHS } from "@/lib/constants";
import { version } from "@/package.json";

export default async function DashboardPage() {
  const clients = await getClients();

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
      <main className="mx-auto max-w-5xl p-6">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-5xl">📋</div>
            <p className="text-lg font-semibold text-foreground">لا يوجد عملاء بعد</p>
            <p className="text-sm text-muted-foreground">ابدأ بإضافة أول عميل من الزر أدناه</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const currentMonthValue = MONTHS[new Date().getMonth()].value;
          const firstMonth = client.activeMonths.includes(currentMonthValue)
            ? currentMonthValue
            : (client.activeMonths[client.activeMonths.length - 1] ?? "jan");
            const monthLabels = client.activeMonths
              .map((mv) => MONTHS.find((m) => m.value === mv)?.label)
              .filter(Boolean)
              .join(" · ");

            return (
              <div
                key={client.id}
                className="group relative rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
              >
                {/* Color bar */}
                <div className="h-1.5 w-full" style={{ backgroundColor: client.color }} />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: client.color }}
                      >
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="font-bold text-foreground text-base leading-tight">{client.name}</h2>
                        <p className="text-[11px] text-muted-foreground font-mono">{client.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <EditClientButton clientId={client.id} clientName={client.name} clientColor={client.color} />
                      <DeleteClientButton clientId={client.id} clientName={client.name} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mb-4">
                    <div>
                      <p className="text-2xl font-bold text-foreground tabular-nums">{client.totalEntries}</p>
                      <p className="text-[11px] text-muted-foreground">منشور</p>
                    </div>
                    <div className="w-px bg-border" />
                    <div>
                      <p className="text-2xl font-bold text-foreground tabular-nums">{client.activeMonths.length}</p>
                      <p className="text-[11px] text-muted-foreground">شهر نشط</p>
                    </div>
                  </div>

                  {/* Active months */}
                  {monthLabels && (
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed truncate" title={monthLabels}>
                      {monthLabels}
                    </p>
                  )}

                  {/* CTA */}
                  <Link
                    href={`/clients/${client.slug}/calendar/${firstMonth}`}
                    className="flex items-center justify-center gap-2 w-full rounded-lg border border-border bg-muted/40 hover:bg-primary hover:text-primary-foreground hover:border-primary py-2 text-sm font-semibold transition-colors group"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    فتح الكالندر
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Add new client card */}
          <NewClientDialog />
        </div>
      </main>
    </div>
  );
}
