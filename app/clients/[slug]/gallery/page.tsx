import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Images } from "lucide-react";
import { getClientBySlug } from "@/app/actions/clients";
import { getEntriesWithAssets } from "@/app/actions/entries";
import { ModeToggle } from "@/app/components/mode-toggle";
import { GalleryClient } from "./GalleryClient";

type Props = { params: Promise<{ slug: string }> };

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params;

  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const entries = await getEntriesWithAssets(client.id);

  return (
    <div className="h-screen bg-background flex flex-col" dir="rtl">
      {/* Accent bar */}
      <div className="h-0.5 shrink-0" style={{ backgroundColor: client.color }} />

      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between px-5 h-14 gap-4">
          {/* Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/`}
              className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="h-5 w-px bg-border shrink-0" />
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{ backgroundColor: client.color }}
              >
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 leading-none">
                <h1 className="text-sm font-semibold text-foreground truncate">{client.name}</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Images className="h-3 w-3" />
                  معرض الإبداع
                </p>
              </div>
            </div>
          </div>

          {/* Stats + controls */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 px-3 py-1.5">
              <span className="font-bold text-foreground tabular-nums">{entries.length}</span> منشور يحتوي ملفات
            </span>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        <GalleryClient entries={entries} slug={slug} />
      </div>
    </div>
  );
}
