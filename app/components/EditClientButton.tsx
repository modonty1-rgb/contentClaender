"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/app/components/ui/dialog";
import { cn } from "@/lib/utils";
import { updateClient } from "@/app/actions/clients";
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

export function EditClientButton({
  clientId,
  clientName,
  clientColor,
}: {
  clientId: string;
  clientName: string;
  clientColor: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(clientName);
  const [color, setColor] = useState(clientColor);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setName(clientName);
    setColor(clientColor);
    setError(null);
    setOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateClient(clientId, { name: name.trim(), color });
      if (result.success) {
        toast.success("تم تعديل بيانات العميل");
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-foreground hover:bg-muted shrink-0"
        onClick={handleOpen}
        title="تعديل العميل"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل العميل</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                اسم العميل
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                {pending ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
              <Button type="button" variant="outline" className="h-10" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
