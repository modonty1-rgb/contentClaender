"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { archiveClient } from "@/app/actions/clients";
import { toast } from "@/app/components/ui/sonner";

export function ArchiveClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveClient(clientId);
      if (result.success) {
        toast.success(`تم أرشفة ${clientName}`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
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
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        title="أرشفة العميل"
      >
        <Archive className="h-3.5 w-3.5" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>أرشفة {clientName}</AlertDialogTitle>
            <AlertDialogDescription>
              العميل يختفي من القائمة الرئيسية لكن يبقى في الأرشيف مع كل منشوراته. تقدر ترجعه في أي وقت من صفحة الأرشيف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={pending}
            >
              {pending ? "جاري الأرشفة..." : "أرشفة"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
