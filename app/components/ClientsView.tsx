"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutGrid, Table2, ChevronRight, ChevronLeft,
  ArrowUp, ArrowDown, ArrowUpDown, Search, X,
  FileText, Share2,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { MONTHS } from "@/lib/constants";
import { NewClientDialog } from "@/app/components/NewClientDialog";
import { ArchiveClientButton } from "@/app/components/ArchiveClientButton";
import { EditClientButton } from "@/app/components/EditClientButton";
import { Input } from "@/app/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/app/components/ui/table";
import type { ClientWithCount, ClientType } from "@/app/actions/clients";

type ViewMode = "cards" | "table";
type TypeFilter = "all" | ClientType;
const STORAGE_KEY = "clients-view";
const FILTER_KEY = "clients-type-filter";
const PAGE_SIZE = 10;

const TYPE_LABEL: Record<ClientType, string> = {
  social: "وسائل تواصل",
  article: "مقالات",
};

function TypeBadge({ type }: { type: ClientType }) {
  const Icon = type === "article" ? FileText : Share2;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        type === "article"
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {TYPE_LABEL[type]}
    </span>
  );
}

function resolveFirstMonth(client: ClientWithCount): string {
  const currentMonthValue = MONTHS[new Date().getMonth()].value;
  return client.activeMonths.includes(currentMonthValue)
    ? currentMonthValue
    : (client.activeMonths[client.activeMonths.length - 1] ?? "jan");
}

function monthLabel(value: string | undefined): string {
  if (!value) return "—";
  return MONTHS.find((m) => m.value === value)?.label ?? value;
}

export function ClientsView({ clients }: { clients: ClientWithCount[] }) {
  const [view, setView] = useState<ViewMode>("cards");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedView = localStorage.getItem(STORAGE_KEY);
    if (savedView === "cards" || savedView === "table") setView(savedView);
    const savedFilter = localStorage.getItem(FILTER_KEY);
    if (savedFilter === "all" || savedFilter === "social" || savedFilter === "article") setTypeFilter(savedFilter);
    setMounted(true);
  }, []);

  function switchView(v: ViewMode) {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  }

  function switchFilter(f: TypeFilter) {
    setTypeFilter(f);
    localStorage.setItem(FILTER_KEY, f);
  }

  const filteredClients = useMemo(
    () => (typeFilter === "all" ? clients : clients.filter((c) => c.type === typeFilter)),
    [clients, typeFilter],
  );

  const counts = useMemo(() => ({
    all: clients.length,
    social: clients.filter((c) => c.type === "social").length,
    article: clients.filter((c) => c.type === "article").length,
  }), [clients]);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <NewClientDialog compact />

        {/* Type filter */}
        <div className="inline-flex rounded-lg border border-border overflow-hidden bg-card">
          {(["all", "social", "article"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => switchFilter(f)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                typeFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {f === "all" ? "الكل" : TYPE_LABEL[f]}
              <span
                className={cn(
                  "tabular-nums text-[10px] font-bold rounded-full min-w-4 text-center leading-4 px-1",
                  typeFilter === f
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="inline-flex rounded-lg border border-border overflow-hidden bg-card">
          <button
            type="button"
            onClick={() => switchView("cards")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
              view === "cards"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
            title="عرض كروت"
            aria-pressed={view === "cards"}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            كروت
          </button>
          <button
            type="button"
            onClick={() => switchView("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
              view === "table"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
            title="عرض جدول"
            aria-pressed={view === "table"}
          >
            <Table2 className="h-3.5 w-3.5" />
            جدول
          </button>
        </div>
      </div>

      {mounted && view === "table" ? (
        <TableView clients={filteredClients} />
      ) : (
        <CardsView clients={filteredClients} />
      )}
    </>
  );
}

function CardsView({ clients }: { clients: ClientWithCount[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {clients.map((client) => {
        const firstMonth = resolveFirstMonth(client);
        return (
          <Link
            key={client.id}
            href={`/clients/${client.slug}/calendar/${firstMonth}`}
            className="group relative rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
          >
            <div className="h-1 w-full" style={{ backgroundColor: client.color }} />
            <div className="p-3 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-1.5 mb-2">
                <h2 className="font-semibold text-foreground text-xs leading-snug wrap-break-word flex-1 min-w-0">
                  {client.name}
                </h2>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <EditClientButton clientId={client.id} clientName={client.name} clientColor={client.color} clientType={client.type} />
                  <ArchiveClientButton clientId={client.id} clientName={client.name} />
                </div>
              </div>
              <div className="mb-2">
                <TypeBadge type={client.type} />
              </div>
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
    </div>
  );
}

// ─── Table View (TanStack) ───────────────────────────────────────────────────

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") return <ArrowUp className="h-3 w-3" />;
  if (dir === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 opacity-40" />;
}

function TableView({ clients }: { clients: ClientWithCount[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<ClientWithCount>[]>(() => [
    {
      id: "color",
      header: "",
      cell: ({ row }) => (
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.original.color }} />
      ),
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: "name",
      header: "الاسم",
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: "type",
      header: "النوع",
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
      enableGlobalFilter: false,
    },
    {
      accessorKey: "totalEntries",
      header: "منشورات",
      cell: ({ row }) => (
        <span className="tabular-nums text-foreground">{row.original.totalEntries}</span>
      ),
      enableGlobalFilter: false,
    },
    {
      id: "monthsCount",
      accessorFn: (row) => row.activeMonths.length,
      header: "شهور",
      cell: ({ row }) => (
        <span className="tabular-nums text-foreground">{row.original.activeMonths.length}</span>
      ),
      enableGlobalFilter: false,
    },
    {
      id: "lastMonth",
      accessorFn: (row) => row.activeMonths[row.activeMonths.length - 1] ?? "",
      header: "آخر شهر",
      cell: ({ row }) => {
        const last = row.original.activeMonths[row.original.activeMonths.length - 1];
        return <span className="text-muted-foreground">{monthLabel(last)}</span>;
      },
      enableGlobalFilter: false,
    },
    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-0.5">
          <EditClientButton
            clientId={row.original.id}
            clientName={row.original.name}
            clientColor={row.original.color}
            clientType={row.original.type}
          />
          <ArchiveClientButton clientId={row.original.id} clientName={row.original.name} />
        </div>
      ),
      enableSorting: false,
      enableGlobalFilter: false,
    },
  ], []);

  const table = useReactTable({
    data: clients,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageStart = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const pageEnd = Math.min((pageIndex + 1) * pageSize, filteredCount);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Toolbar: search */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/20 p-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            dir="rtl"
            placeholder="ابحث بالاسم..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-8 text-xs pr-8 pl-7"
          />
          {globalFilter && (
            <button
              type="button"
              onClick={() => setGlobalFilter("")}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title="مسح البحث"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const dir = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-10 py-2 px-3 text-xs",
                      header.column.id === "color" && "w-10",
                      header.column.id === "totalEntries" && "w-24 text-center",
                      header.column.id === "monthsCount" && "w-20 text-center",
                      header.column.id === "lastMonth" && "w-28 text-center",
                      header.column.id === "actions" && "w-24 text-center",
                    )}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon dir={dir} />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-6 text-center text-sm text-muted-foreground">
                لا توجد نتائج
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              const firstMonth = resolveFirstMonth(row.original);
              return (
                <TableRow
                  key={row.id}
                  onClick={() => router.push(`/clients/${row.original.slug}/calendar/${firstMonth}`)}
                  className="hover:bg-muted/40 cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "p-3",
                        (cell.column.id === "type" || cell.column.id === "totalEntries" || cell.column.id === "monthsCount" || cell.column.id === "lastMonth" || cell.column.id === "actions") && "text-center",
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination bar */}
      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-3 py-2">
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {pageStart}–{pageEnd} من {filteredCount}
          {globalFilter && filteredCount !== clients.length && (
            <span className="text-muted-foreground/60"> (مفلتر من {clients.length})</span>
          )}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="السابق"
          >
            <ChevronRight className="h-3 w-3" />
            السابق
          </button>
          <span className="text-[11px] text-muted-foreground tabular-nums px-2">
            {pageIndex + 1} / {Math.max(1, table.getPageCount())}
          </span>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="التالي"
          >
            التالي
            <ChevronLeft className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
