"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/app/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/app/actions/clients";
import { toast } from "@/app/components/ui/sonner";

const COLORS = [
  { value: "#6366f1", label: "بنفسجي" },
  { value: "#0ea5e9", label: "أزرق" },
  { value: "#10b981", label: "أخضر" },
  { value: "#f59e0b", label: "ذهبي" },
  { value: "#ef4444", label: "أحمر" },
  { value: "#8b5cf6", label: "موف" },
  { value: "#ec4899", label: "وردي" },
  { value: "#14b8a6", label: "فيروزي" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function NewClientDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createClient({ name: name.trim(), slug: slugify(name.trim()), color });
      if (result.success) {
        toast.success(`تم إضافة ${name.trim()}`);
        setOpen(false);
        setName(""); setColor(COLORS[0].value);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all p-8 text-center min-h-50 cursor-pointer"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">إضافة عميل جديد</p>
            <p className="text-xs text-muted-foreground mt-0.5">أنشئ كالندر محتوى خاص</p>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>عميل جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              اسم العميل
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: JBR SEO"
              className="h-10"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              اللون المميز
            </Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    color === c.value
                      ? "border-foreground scale-110 ring-2 ring-foreground/20 ring-offset-1"
                      : "border-transparent hover:scale-110 hover:border-foreground/40 hover:ring-2 hover:ring-foreground/10 hover:ring-offset-1",
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={pending} className="flex-1 h-10 font-semibold">
              {pending ? "جاري الإضافة..." : "إضافة العميل"}
            </Button>
            <Button type="button" variant="outline" className="h-10" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
