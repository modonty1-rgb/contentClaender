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
      <main className="mx-auto max-w-7xl p-4">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-5xl">📋</div>
            <p className="text-lg font-semibold text-foreground">لا يوجد عملاء بعد</p>
            <p className="text-sm text-muted-foreground">ابدأ بإضافة أول عميل من الزر أدناه</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {clients.map((client) => {
            const currentMonthValue = MONTHS[new Date().getMonth()].value;
          const firstMonth = client.activeMonths.includes(currentMonthValue)
            ? currentMonthValue
            : (client.activeMonths[client.activeMonths.length - 1] ?? "jan");

            return (
              <Link
                key={client.id}
                href={`/clients/${client.slug}/calendar/${firstMonth}`}
                className="group relative rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
              >
                {/* Color bar */}
                <div className="h-1 w-full" style={{ backgroundColor: client.color }} />

                <div className="p-3 flex flex-col flex-1">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-1.5 mb-2.5">
                    <h2 className="font-semibold text-foreground text-xs leading-snug wrap-break-word flex-1 min-w-0">
                      {client.name}
                    </h2>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <EditClientButton clientId={client.id} clientName={client.name} clientColor={client.color} />
                      <DeleteClientButton clientId={client.id} clientName={client.name} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-auto">
                    <div>
                      <p className="text-lg font-bold text-foreground tabular-nums leading-none">{client.totalEntries}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">منشور</p>
                    </div>
                    <div className="h-6 w-px bg-border" />
                    <div>
                      <p className="text-lg font-bold text-foreground tabular-nums leading-none">{client.activeMonths.length}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">شهر</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Add new client card */}
          <NewClientDialog />
        </div>
      </main>
    </div>
  );
}
